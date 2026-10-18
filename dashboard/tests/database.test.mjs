import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec(`
 create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon;
 grant execute on function auth.uid() to authenticated,anon;
`);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/202610180001_workspace.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222",
  outsider = "33333333-3333-4333-8333-333333333333",
  space = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
await db.query("insert into auth.users values($1),($2),($3)", [a, b, outsider]);
await db.query(
  "insert into public.veyro_workspaces(id,name) values($1,'VEYRO')",
  [space],
);
await db.query(
  "insert into public.veyro_members(workspace_id,user_id,person_key,display_name) values($1,$2,'u1','Osoba A'),($1,$3,'u2','Osoba B')",
  [space, a, b],
);
async function login(id, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role " + role);
}
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log("OK " + name);
}
await test("Czlonek widzi przestrzen i zespol", async () => {
  await login(a);
  assert.equal(
    (await db.query("select * from public.veyro_workspaces")).rows.length,
    1,
  );
  assert.equal(
    (await db.query("select * from public.veyro_members")).rows.length,
    2,
  );
});
async function write(user, payload, rev, deleted = false) {
  await login(user);
  return (
    await db.query(
      "select * from public.veyro_write_entity($1,$2,$3,$4::jsonb,$5,$6)",
      [space, "clients", "client-test", JSON.stringify(payload), rev, deleted],
    )
  ).rows[0];
}
await test("Utworzenie rekordu przez pierwsza osobe", async () => {
  assert.equal(Number((await write(a, { name: "Klient A" }, 0)).revision), 1);
});
await test("Druga osoba czyta wspolny rekord", async () => {
  await login(b);
  assert.equal(
    (await db.query("select payload from public.veyro_entities")).rows[0]
      .payload.name,
    "Klient A",
  );
});
await test("Druga osoba zmienia wersje", async () => {
  assert.equal(Number((await write(b, { name: "Klient B" }, 1)).revision), 2);
});
await test("Stary zapis nie nadpisuje nowszego", async () => {
  await assert.rejects(
    write(a, { name: "Nie nadpisuj" }, 1),
    (e) => e.code === "40001",
  );
  await login(a);
  assert.equal(
    (await db.query("select payload from public.veyro_entities")).rows[0]
      .payload.name,
    "Klient B",
  );
});
await test("Ponowne utworzenie nie nadpisuje rekordu", async () => {
  await assert.rejects(
    write(a, { name: "Duplikat" }, 0),
    (e) => e.code === "40001",
  );
});
await test("Obca osoba nie odczytuje danych", async () => {
  await login(outsider);
  for (const table of ["veyro_workspaces", "veyro_members", "veyro_entities"])
    assert.equal(
      (await db.query("select * from public." + table)).rows.length,
      0,
    );
});
await test("Obca osoba nie zapisuje danych", async () => {
  await assert.rejects(
    write(outsider, { name: "Intruz" }, 2),
    (e) => e.code === "42501",
  );
});
await test("Bezposredni zapis i dodanie czlonka zabronione", async () => {
  await login(a);
  await assert.rejects(
    db.exec("update public.veyro_entities set payload='{}'::jsonb"),
    (e) => e.code === "42501",
  );
  await assert.rejects(
    db.exec("delete from public.veyro_entities"),
    (e) => e.code === "42501",
  );
  await assert.rejects(
    db.query(
      "insert into public.veyro_members values($1,$2,'u3','Intruz',now())",
      [space, outsider],
    ),
    (e) => e.code === "42501",
  );
});
await test("Anonimowy uzytkownik bez dostepu", async () => {
  await login("", "anon");
  await assert.rejects(
    db.exec("select * from public.veyro_entities"),
    (e) => e.code === "42501",
  );
  await assert.rejects(
    db.query("select public.veyro_write_entity($1,$2,$3,$4::jsonb,$5,$6)", [
      space,
      "clients",
      "x",
      "{}",
      0,
      false,
    ]),
    (e) => e.code === "42501",
  );
});
await test("Usuniecie i przywrocenie z wersjonowaniem", async () => {
  const gone = await write(a, { name: "Klient B" }, 2, true);
  assert.ok(gone.deleted_at);
  assert.equal(Number(gone.revision), 3);
  const restored = await write(b, { name: "Klient B" }, 3);
  assert.equal(restored.deleted_at, null);
  assert.equal(Number(restored.revision), 4);
});
await test("Nieprawidlowy ladunek nie przechodzi", async () => {
  await assert.rejects(write(a, [], 4), (e) => e.code === "22023");
});
await test("Cofniecie czlonkostwa odcina zapis", async () => {
  await db.exec("reset role");
  await db.query("delete from public.veyro_members where user_id=$1", [b]);
  await assert.rejects(
    write(b, { name: "Byly czlonek" }, 4),
    (e) => e.code === "42501",
  );
});
console.log(`Wynik: ${passed}/13 testow polityk i wspolnego zapisu.`);
await db.close();
