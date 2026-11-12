/* LWTC printed forms.
   LWTCSheet.print(values, meta)         the Financial Responsibility paper form, built from the form's configuration
   LWTCSheet.printGeneric(values, meta)  a clean document for forms created in the Form Manager
   values: studentName, studentId, phone, email, term, program, section, startDate, dropAddEnds, fafsaStatus, fundingSources[],
           otherFunding, initials[], agreed[] (the statements as agreed), signature, signatureDate, printedName, under18,
           guardianSignature, guardianDate, customAnswers[{label,value}], documents[{label,name,size}], additionalSections[],
           dropAddBasis, dropAddOverride, office:{docOnFile,balanceDue,reviewedBy,reviewedAt}
   meta:   config (the form configuration), title (the file name when saving as PDF), note (a line in the page footer)
   Dates may be "YYYY-MM-DD" (shown as "Oct 31, 2026") or already formatted text (shown as is). */
(function(){
  var script=document.currentScript;
  var base=(script&&script.src?script.src:'assets/print-sheet.js').replace(/print-sheet\.js(\?.*)?$/,'');
  var HUES=['o','gr','go','bl'],BUB=['',' tr',' br',' tl'];
  var OFFICE_DEFAULT={name:'Financial Aid Office',address1:'3702 Estey Avenue',address2:'Naples, FL 34104',phone:'239-377-0900',hours:'Mon\u2013Fri, 7:00 a.m.\u20133:00 p.m.'};

  function E(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  function A(parent){for(var i=1;i<arguments.length;i++)if(arguments[i])parent.appendChild(arguments[i]);return parent}
  function fmtDate(v){
    var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v||'');
    if(!m)return v||'';
    return new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
  function human(n){return n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB'}
  function rich(el,text){if(window.LWTCForm)el.appendChild(window.LWTCForm.rich(text));else el.appendChild(E('p',null,text));return el}
  function defaults(){return window.LWTC_DEFAULT_FINANCIAL||{title:'Financial options & payment responsibility',subtitle:'Student Acknowledgement Form',features:{},fields:{},fundingOptions:[],fundingSources:[],statements:[],signatureText:''}}

  function root(){
    var el=document.getElementById('printSheet');
    if(!el){el=E('div');el.id='printSheet';el.setAttribute('aria-hidden','true');document.body.appendChild(el)}
    return el;
  }
  function heading(n,text,hue,shape){
    var h=E('div','p-h '+hue);A(h,E('span','bub'+shape,String(n)),E('h3',null,text));return h;
  }
  function header(office,withRule){
    var f=document.createDocumentFragment(),o=office||OFFICE_DEFAULT;
    var head=E('div','p-head');
    var logo=E('img','p-logo');logo.src=base+'lwtc-logo.png';logo.alt='';logo.decoding='sync';logo.loading='eager';
    var box=E('div','p-office');
    A(box,E('b',null,o.name||OFFICE_DEFAULT.name),E('span',null,[o.address1,o.address2].filter(Boolean).join(', ')),E('span',null,[o.phone,o.hours].filter(Boolean).join('  \u00b7  ')));
    A(head,logo,box);A(f,head);
    var rule=E('div','p-rule');for(var i=0;i<4;i++)rule.appendChild(E('i'));A(f,rule);
    return f;
  }
  function footer(office,note,pageText){
    var f=E('div','p-foot');
    A(f,E('span',null,(office&&office.footerText)||'Lorenzo Walker Technical College  \u00b7  Financial Aid Office  \u00b7  Rev. 10/2026'),E('span',null,note||''),E('span','p-pg',pageText||''));
    return f;
  }
  function cell(label,value){var c=E('div','p-cell');A(c,E('span','p-lab',label),E('span','p-val',value||''));return c}

  /* ---------- the Financial Responsibility form ---------- */
  function buildFinancial(v,meta){
    var cfg=meta.config||defaults(),F=cfg.fields||{},ft=cfg.features||{},office=meta.office||OFFICE_DEFAULT;
    var lab=function(k,d){return (F[k]&&F[k].label)||d};
    var sheet=E('div','sheet');

    /* page 1 */
    var p1=E('section','pp');
    A(p1,header(office));
    A(p1,E('h1','p-title',cfg.title||'Financial options & payment responsibility'));
    if(cfg.subtitle)A(p1,E('p','p-sub',cfg.subtitle));
    var dl=E('div','p-deadline');
    A(dl,E('h4',null,'Payment deadline: end of drop/add'));
    var dp=E('p');dp.appendChild(document.createTextNode('All outstanding '));dp.appendChild(E('b',null,'tuition, laboratory fees, and user fees'));
    dp.appendChild(document.createTextNode(' must be paid in full \u2014 or covered by an approved funding source on file with the Financial Aid Office \u2014 '));
    dp.appendChild(E('b',null,'by the end of the drop/add period'));dp.appendChild(document.createTextNode(' for each term of enrollment.'));
    A(dl,dp);
    var terms=E('div','p-terms');
    var t1=E('div');A(t1,document.createTextNode(lab('term','Term')+': '),E('span','u',v.term||''));
    var t2=E('div');A(t2,document.createTextNode(lab('dropAddEnds','Drop/add period ends')+': '),E('span','u',fmtDate(v.dropAddEnds)));
    A(terms,t1,t2);A(dl,terms);
    var bits=[];
    if(v.section)bits.push('Section '+v.section);
    if(v.dropAddBasis)bits.push('Drop/add calculated as '+String(v.dropAddBasis).replace(/^./,function(c){return c.toLowerCase()}));
    if(v.dropAddOverride)bits.push('Adjusted by Financial Aid staff');
    A(dl,E('div','p-basis',bits.join(' \u00b7 ')));
    var ex=(v.additionalSections||[]).filter(Boolean).map(function(x){var q=String(x).split(' \u00b7 ');return q.length>=3?q[0]+' ('+q[2].replace(/^section /,'')+')':x});
    A(dl,E('div','p-basis',ex.length?'Also enrolled: '+ex.join('; ')+'. The earliest drop/add date applies.':''));
    A(p1,dl);

    A(p1,heading(1,'Student information','o',''));
    var r1=E('div','p-row r1'),r2=E('div','p-row r2'),r3=E('div','p-row r3');
    A(r1,cell(lab('studentName','Full legal name'),v.studentName),cell(F.studentId&&F.studentId.label||'Student ID #',v.studentId));
    A(r2,cell(lab('phone','Phone number'),v.phone),cell(lab('email','Email address'),v.email));
    A(r3,cell(lab('program','Program of study'),v.program),cell(lab('startDate','Anticipated start date'),fmtDate(v.startDate)));
    A(p1,r1,r2,r3);

    var cards=(cfg.fundingOptions||[]).filter(function(o){return o.enabled!==false});
    if(cards.length){
      A(p1,heading(2,'Financial aid & assistance options','gr',' tr'));
      A(p1,E('p','p-intro').appendChild(document.createTextNode('Please review the funding options below. Students are encouraged to apply for all options for which they may be eligible ')).parentNode);
      var intro=p1.lastChild;intro.appendChild(E('i',null,'before'));intro.appendChild(document.createTextNode(' the start of the term so that funding is in place by the drop/add deadline.'));
      var grid=E('div','p-cards');
      cards.forEach(function(o,i){
        var card=E('div','p-card '+HUES[i%4]);
        var h=E('h5');A(h,E('span','bub'+BUB[i%4],String.fromCharCode(65+i)),document.createTextNode(o.title));A(card,h);
        var body=E('div');rich(body,o.body);
        var qr=ft.qrCodes!==false&&o.qrUrl&&window.LWTCForm?window.LWTCForm.qrDataUri(o.qrUrl):'';
        if(qr){
          var wq=E('div','wq'),left=E('div');left.appendChild(body);var box=E('div','p-qr'),img=E('img');img.src=qr;img.alt='';img.decoding='sync';
          A(box,img,E('i',null,'Scan to apply on your phone'));A(wq,left,box);A(card,wq);
        }else A(card,body);
        A(grid,card);
      });
      A(p1,grid);
    }
    A(p1,footer(office,meta.note,'Page 1 of __N__'));

    /* page 2 */
    var p2=E('section','pp');
    A(p2,heading(3,'Anticipated funding plan  (check all that apply)','go',' br'));
    var checks=E('div','p-checks');
    if(ft.fafsa!==false){
      var fa=E('div','fa');A(fa,E('b',null,lab('fafsa','FAFSA')));
      var FA=['I have submitted my FAFSA','I will submit my FAFSA','I will not submit my FAFSA'],old={'I applied':FA[0],'I will apply':FA[1],'I will not apply':FA[2]},cur=old[v.fafsaStatus]||v.fafsaStatus;
      FA.forEach(function(t){var sp=E('span');A(sp,E('i','cb'+(cur===t?' on':'')),document.createTextNode(' '+t));fa.appendChild(sp)});
      A(checks,fa);
    }
    var srcs=(cfg.fundingSources||[]).filter(function(s){return s.enabled!==false}).map(function(s){return s.label});
    // two columns, filled down the left first, then down the right
    var half=Math.ceil(srcs.length/2),picked=v.fundingSources||[];
    var one=function(label){var d=E('div');A(d,E('i','cb'+(picked.indexOf(label)>-1?' on':'')),document.createTextNode(' '+label));return d};
    for(var i=0;i<half;i++){A(checks,one(srcs[i]));checks.appendChild(srcs[half+i]!==undefined?one(srcs[half+i]):E('div','p-blank'))}
    A(p2,checks);
    if(ft.otherFunding!==false){
      var oth=E('div','p-other');A(oth,E('i','cb'+(picked.indexOf('Other')>-1?' on':'')),document.createTextNode(' Other: '),E('span','u',v.otherFunding||''));A(p2,oth);
    }
    var stm=(v.agreed&&v.agreed.length)?v.agreed:(cfg.statements||[]).filter(function(s){return s.enabled!==false}).map(function(s){return s.text});
    if(stm.length){
      A(p2,heading(4,'Financial responsibility acknowledgement','bl',' tl'));
      A(p2,E('p','p-intro','Please read each statement and initial to confirm your understanding.'));
      var ack=E('div','p-ack');
      stm.forEach(function(text,i){
        var row=E('div','p-ar '+HUES[i%4]);
        var tx=E('div','p-at'),sp=E('span');sp.appendChild(window.LWTCForm?window.LWTCForm.richInline(text):document.createTextNode(text));tx.appendChild(sp);
        var ini=E('div','p-ai');A(ini,E('small',null,'Initials'),E('b',null,(v.initials||[])[i]||''));
        A(row,E('div','p-an',String(i+1)),tx,ini);A(ack,row);
      });
      A(p2,ack);
    }
    A(p2,E('p','p-agree',cfg.signatureText||'By signing below, I confirm that I have read and understand this form and agree to its terms.'));
    var s1=E('div','p-sig');s1.style.marginTop='10pt';
    var sc1=E('div','p-sc'),sc2=E('div','p-sc');
    A(sc1,E('div','p-sv sig',v.signature||''),E('span','p-sl','Student signature'));A(sc2,E('div','p-sv',fmtDate(v.signatureDate)),E('span','p-sl','Date'));A(s1,sc1,sc2);A(p2,s1);
    var s2=E('div','p-sig one'),sc3=E('div','p-sc');A(sc3,E('div','p-sv',v.printedName||''),E('span','p-sl','Printed name'));A(s2,sc3);A(p2,s2);
    if(ft.guardian!==false){
      var s3=E('div','p-sig'),g1=E('div','p-sc'),g2=E('div','p-sc');
      A(g1,E('div','p-sv sig',v.under18?(v.guardianSignature||''):''),E('span','p-sl','Parent / guardian signature (if student is under 18)'));
      A(g2,E('div','p-sv',v.under18?fmtDate(v.guardianDate):''),E('span','p-sl','Date'));A(s3,g1,g2);A(p2,s3);
    }
    var o=v.office||{},ou=E('div','p-office-use');
    A(ou,E('h6',null,'For Financial Aid Office use only'));
    var l1=E('div','p-oline');A(l1,document.createTextNode('Funding documentation on file: '),E('i','cb'+(o.docOnFile?' on':'')),document.createTextNode(' Yes '),E('i','cb'),document.createTextNode(' Pending '),E('i','cb'),document.createTextNode(' N/A '),E('span','gap'),document.createTextNode('Balance due at drop/add: $'),E('span','u',o.balanceDue||''));
    var l2=E('div','p-oline');A(l2,document.createTextNode('Reviewed by: '),E('span','u wide',o.reviewedBy||''),document.createTextNode(' '),E('span','gap'),document.createTextNode('Date: '),E('span','u',fmtDate(o.reviewedAt)),document.createTextNode(' '),E('span','gap'),document.createTextNode('Entered in Focus: '),E('i','cb'));
    A(ou,l1,l2);A(p2,ou);
    A(p2,footer(office,meta.note,'Page 2 of __N__'));
    A(sheet,p1,p2);

    /* page 3: only when there is something to show */
    var qa=(v.customAnswers||[]).filter(function(x){return x&&x.label}),docs=(v.documents||[]).filter(Boolean);
    if(qa.length||docs.length)A(sheet,extraPage(qa,docs,office,meta.note,'Page 3 of __N__'));
    var pages=sheet.querySelectorAll('.pp');
    [].forEach.call(sheet.querySelectorAll('.p-pg'),function(n){n.textContent=n.textContent.replace('__N__',String(pages.length))});
    return sheet;
  }
  function extraPage(qa,docs,office,note,pageText){
    var p=E('section','pp');
    A(p,header(office));
    A(p,E('h1','p-title','Additional information'));
    if(qa.length){
      A(p,heading(1,'Answers','o',''));
      var t=E('div','p-qa');
      qa.forEach(function(x){var r=E('div','p-qr2');A(r,E('div','p-q',x.label),E('div','p-a',Array.isArray(x.value)?x.value.join(', '):String(x.value)));A(t,r)});A(p,t);
    }
    if(docs.length){
      A(p,heading(qa.length?2:1,'Supporting documents uploaded','gr',' tr'));
      var ul=E('ul','p-docs');
      docs.forEach(function(d){var li=E('li');A(li,E('b',null,d.label||'Document'),document.createTextNode(' \u2014 '+(d.name||'file')+(d.size?' ('+human(d.size)+')':'')));A(ul,li)});A(p,ul);
      A(p,E('p','p-intro','The files themselves are kept securely in the Financial Aid Office\u2019s records.'));
    }
    A(p,footer(office,note,pageText));
    return p;
  }

  /* ---------- a form created in the Form Manager ---------- */
  function buildGeneric(v,meta){
    var cfg=meta.config||{title:'Form',fields:{},features:{},statements:[]},F=cfg.fields||{},office=meta.office||OFFICE_DEFAULT;
    var sheet=E('div','sheet gen');
    var p=E('section','pp flow');
    A(p,header(office));
    A(p,E('h1','p-title',cfg.title||'Form'));
    if(cfg.subtitle)A(p,E('p','p-sub',cfg.subtitle));
    A(p,heading(1,'Student information','o',''));
    var r1=E('div','p-row r1'),r2=E('div','p-row r2');
    A(r1,cell((F.studentName&&F.studentName.label)||'Full legal name',v.studentName),cell((F.studentId&&F.studentId.label)||'Student ID #',v.studentId));
    A(r2,cell((F.phone&&F.phone.label)||'Phone number',v.phone),cell((F.email&&F.email.label)||'Email address',v.email));
    A(p,r1,r2);
    var qa=(v.customAnswers||[]).filter(function(x){return x&&x.label}),n=2;
    if(qa.length){
      A(p,heading(n++,'Answers','gr',' tr'));
      var t=E('div','p-qa');
      qa.forEach(function(x){var r=E('div','p-qr2');A(r,E('div','p-q',x.label),E('div','p-a',Array.isArray(x.value)?x.value.join(', '):String(x.value)));A(t,r)});A(p,t);
    }
    var docs=(v.documents||[]).filter(Boolean);
    if(docs.length){
      A(p,heading(n++,'Supporting documents uploaded','go',' br'));
      var ul=E('ul','p-docs');docs.forEach(function(d){var li=E('li');A(li,E('b',null,d.label||'Document'),document.createTextNode(' \u2014 '+(d.name||'file')+(d.size?' ('+human(d.size)+')':'')));A(ul,li)});A(p,ul);
    }
    var stm=(v.agreed&&v.agreed.length)?v.agreed:[];
    if(stm.length){
      A(p,heading(n++,'Acknowledgement','bl',' tl'));
      var ack=E('div','p-ack');
      stm.forEach(function(text,i){
        var row=E('div','p-ar '+HUES[i%4]),tx=E('div','p-at'),sp=E('span');sp.appendChild(window.LWTCForm?window.LWTCForm.richInline(text):document.createTextNode(text));tx.appendChild(sp);
        var ini=E('div','p-ai');A(ini,E('small',null,'Initials'),E('b',null,(v.initials||[])[i]||''));A(row,E('div','p-an',String(i+1)),tx,ini);A(ack,row);
      });A(p,ack);
    }
    A(p,E('p','p-agree',cfg.signatureText||'By signing below, I confirm that the information I provided is accurate.'));
    var s1=E('div','p-sig');s1.style.marginTop='10pt';var sc1=E('div','p-sc'),sc2=E('div','p-sc');
    A(sc1,E('div','p-sv sig',v.signature||''),E('span','p-sl','Student signature'));A(sc2,E('div','p-sv',fmtDate(v.signatureDate)),E('span','p-sl','Date'));A(s1,sc1,sc2);A(p,s1);
    var s2=E('div','p-sig one'),sc3=E('div','p-sc');A(sc3,E('div','p-sv',v.printedName||''),E('span','p-sl','Printed name'));A(s2,sc3);A(p,s2);
    if(v.under18){
      var s3=E('div','p-sig'),g1=E('div','p-sc'),g2=E('div','p-sc');
      A(g1,E('div','p-sv sig',v.guardianSignature||''),E('span','p-sl','Parent / guardian signature'));A(g2,E('div','p-sv',fmtDate(v.guardianDate)),E('span','p-sl','Date'));A(s3,g1,g2);A(p,s3);
    }
    var foot=footer(office,meta.note,'');foot.className+=' flowfoot';A(p,foot);
    A(sheet,p);return sheet;
  }

  /* ---------- fit, print ---------- */
  // If an administrator's content makes a page longer than the paper, shrink that page a little (never below 78%).
  function fit(){
    var pages=[].slice.call(document.querySelectorAll('#printSheet .pp:not(.flow)'));
    pages.forEach(function(p){
      p.style.zoom='';
      var f=p.querySelector('.p-foot');if(!f)return;
      var top=p.getBoundingClientRect().top,foot=f.getBoundingClientRect().top-top-6,last=0;
      [].forEach.call(p.children,function(c){if(c!==f)last=Math.max(last,c.getBoundingClientRect().bottom-top)});
      if(last>foot){var z=Math.max(0.78,foot/last);p.style.zoom=String(z);}
    });
  }
  function fill(v,meta,generic){
    var r=root();r.textContent='';meta=meta||{};
    r.appendChild(generic?buildGeneric(v||{},meta):buildFinancial(v||{},meta));
  }
  function loadFonts(){
    var faces=['400 12pt "Alfa Slab One"','400 10pt "Source Sans 3"','italic 400 10pt "Source Sans 3"','600 10pt "Source Sans 3"','italic 600 10pt "Source Sans 3"','700 10pt "Source Sans 3"'];
    if(!(document.fonts&&document.fonts.load))return Promise.resolve();
    return Promise.all(faces.map(function(f){return document.fonts.load(f)})).then(function(){},function(){});
  }
  function imagesReady(){
    var jobs=[].map.call(root().querySelectorAll('img'),function(img){return (img.decode?img.decode():Promise.resolve()).then(function(){},function(){})});
    var limit=new Promise(function(done){setTimeout(done,5000)});
    return Promise.race([Promise.all(jobs),limit]);
  }
  function doPrint(v,meta,generic){
    meta=meta||{};fill(v,meta,generic);
    var prev=document.title;if(meta.title)document.title=meta.title;
    document.body.classList.add('print-sheet');
    var done=function(){document.title=prev;document.body.classList.remove('print-sheet');window.removeEventListener('afterprint',done)};
    window.addEventListener('afterprint',done);
    return Promise.all([loadFonts(),imagesReady()]).then(function(){fit();window.print()});
  }
  window.LWTCSheet={
    fill:function(v,meta){fill(v,meta,false)},fillGeneric:function(v,meta){fill(v,meta,true)},fit:fit,fmtDate:fmtDate,
    print:function(v,meta){return doPrint(v,meta,false)},printGeneric:function(v,meta){return doPrint(v,meta,true)}
  };
})();
