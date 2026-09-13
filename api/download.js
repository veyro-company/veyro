const https = require('https');
const fs = require('fs');
const path = require('path');

function stripeGet(p) {
  return new Promise((resolve, reject) => {
    const req = https.request({hostname:'api.stripe.com',path:p,method:'GET',headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`}}, res => {
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(data)})}catch(e){reject(e)}});
    }); req.on('error',reject); req.end();
  });
}
module.exports = async (req,res) => {
  const sessionId=String(req.query.session_id||'');
  if(!sessionId.startsWith('cs_test_') || !process.env.STRIPE_SECRET_KEY) return res.status(403).send('Brak dostępu.');
  try {
    const r=await stripeGet(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`); const s=r.body;
    const ok=r.status===200 && s.payment_status==='paid' && s.mode==='payment' && s.amount_total===1999 && s.currency==='pln';
    if(!ok) return res.status(403).send('Płatność nie została potwierdzona.');
    const file=path.join(process.cwd(),'private','poradnik.pdf');
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="Veyro-Pierwsze-1000-zl.pdf"');
    res.setHeader('Cache-Control','private, no-store');
    fs.createReadStream(file).pipe(res);
  } catch { res.status(500).send('Błąd serwera.'); }
};
