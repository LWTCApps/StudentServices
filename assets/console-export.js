/* LWTC staff console: export the filtered, sorted list.
   LWTCExport.columns / defaults        what can be exported
   LWTCExport.matrix(items, columnIds)  rows ready to write
   LWTCExport.csv(m) / tsv(m) / xlsx(m, about)   file contents (xlsx returns a Uint8Array)
   LWTCExport.download(data, filename, mime)
   LWTCExport.printReport(m, meta)      the branded PDF (the browser's "Save as PDF")
   Everything is built in the browser from data the person can already see. */
(function(){
  var NS=window.LWTCExport={};
  var script=document.currentScript;
  var base=(script&&script.src?script.src:'assets/console-export.js').replace(/console-export\.js(\?.*)?$/,'');
  function pad(n){return n<10?'0'+n:''+n}
  function fv(i,key){var f=(i.fields||[]).filter(function(x){return x.key===key})[0];return f?f.value:undefined}
  function join(v,sep){return Array.isArray(v)?v.join(sep||'; '):(v==null?'':String(v))}
  var FAFSA_OLD={'I applied':'I have submitted my FAFSA','I will apply':'I will submit my FAFSA','I will not apply':'I will not submit my FAFSA'};
  function docs(i){return (i.print&&i.print.documents)||[]}

  /* ---- columns ---- */
  NS.columns=[
    {id:'reference',label:'Reference',group:'Student',type:'text',get:function(i){return i.reference}},
    {id:'submitted',label:'Submitted',group:'Student',type:'datetime',get:function(i){return i.submitted}},
    {id:'form',label:'Form',group:'Student',type:'text',get:function(i){return i.formLabel}},
    {id:'student',label:'Student',group:'Student',type:'text',get:function(i){return i.studentName}},
    {id:'studentId',label:'Student ID',group:'Student',type:'text',get:function(i){return i.studentId}},
    {id:'email',label:'Email',group:'Student',type:'text',get:function(i){return i.email}},
    {id:'phone',label:'Phone',group:'Student',type:'text',get:function(i){return i.phone}},
    {id:'status',label:'Status',group:'Student',type:'text',get:function(i){return i.status||'New'}},
    {id:'program',label:'Program',group:'Enrollment',type:'text',get:function(i){return fv(i,'program')}},
    {id:'term',label:'Term',group:'Enrollment',type:'text',get:function(i){return fv(i,'term')}},
    {id:'section',label:'Section',group:'Enrollment',type:'text',get:function(i){return fv(i,'section')}},
    {id:'startDate',label:'Start date',group:'Enrollment',type:'date',get:function(i){return fv(i,'startDate')}},
    {id:'dropAddEnds',label:'Drop/add ends',group:'Enrollment',type:'date',get:function(i){return fv(i,'dropAddEnds')}},
    {id:'fafsa',label:'FAFSA',group:'Funding',type:'text',get:function(i){var v=fv(i,'fafsaStatus');return FAFSA_OLD[v]||v}},
    {id:'funding',label:'Ways of paying',group:'Funding',type:'text',get:function(i){return join(fv(i,'fundingSources'))}},
    {id:'otherFunding',label:'Other funding',group:'Funding',type:'text',get:function(i){return fv(i,'otherFunding')}},
    {id:'balance',label:'Balance due',group:'Funding',type:'money',get:function(i){return i.balanceDue}},
    {id:'docCount',label:'Documents uploaded',group:'Records',type:'int',get:function(i){return docs(i).length}},
    {id:'docNames',label:'Document names',group:'Records',type:'text',get:function(i){return docs(i).map(function(d){return d.label+': '+d.name}).join('; ')}},
    {id:'answers',label:'Additional answers',group:'Records',type:'text',get:function(i){return ((i.print&&i.print.customAnswers)||[]).map(function(x){return x.label+': '+join(x.value,', ')}).join(' | ')}},
    {id:'reviewedBy',label:'Reviewed by',group:'Records',type:'text',get:function(i){return i.reviewedBy}},
    {id:'reviewedAt',label:'Reviewed at',group:'Records',type:'datetime',get:function(i){return i.reviewedAt}},
    {id:'notes',label:'Staff notes',group:'Records',type:'text',get:function(i){return i.staffNotes}}
  ];
  NS.defaults={
    table:['reference','submitted','form','student','studentId','email','phone','status','program','term','dropAddEnds'],
    pdf:['student','studentId','program','term','status','submitted','dropAddEnds']
  };

  /* ---- values ---- */
  var DATE_RE=/^(\d{4})-(\d{2})-(\d{2})/;
  function cell(col,item){
    var v=col.get(item);if(v==null||v==='')return {v:'',t:'text'};
    if(col.type==='date'){return DATE_RE.test(v)?{v:String(v).slice(0,10),t:'date'}:{v:String(v),t:'text'}}
    if(col.type==='datetime'){var d=new Date(v);return isNaN(d)?{v:String(v),t:'text'}:{v:d,t:'datetime'}}
    if(col.type==='money'){var n=Number(v);return isFinite(n)?{v:n,t:'money'}:{v:String(v),t:'text'}}
    if(col.type==='int'){return {v:Number(v)||0,t:'int'}}
    return {v:String(v),t:'text'};
  }
  NS.matrix=function(items,ids){
    var cols=ids.map(function(id){return NS.columns.filter(function(c){return c.id===id})[0]}).filter(Boolean);
    return {cols:cols,headers:cols.map(function(c){return c.label}),rows:items.map(function(i){return cols.map(function(c){return cell(c,i)})})};
  };
  /** How a cell reads as text. "iso" is for files (sortable); "pretty" is for the printed report. */
  function text(c,style){
    if(c.v===''||c.v==null)return '';
    if(c.t==='date'){if(style==='pretty'){var m=DATE_RE.exec(c.v);return new Date(+m[1],+m[2]-1,+m[3]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}return c.v}
    if(c.t==='datetime'){var d=c.v;return style==='pretty'?d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
    if(c.t==='money')return style==='pretty'?'$'+c.v.toFixed(2):c.v.toFixed(2);
    return String(c.v);
  }
  /** A cell that begins with = + - @ could be run as a formula by a spreadsheet. Student-typed text must never be. */
  function safe(s){return /^[=+\-@\t\r]/.test(s)?"'"+s:s}
  function cleanText(c,style){var s=text(c,style);return c.t==='text'?safe(s):s}

  /* ---- CSV and tab-separated (for pasting into Google Sheets) ---- */
  NS.csv=function(m){
    function q(s){return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
    var lines=[m.headers.map(q).join(',')];
    m.rows.forEach(function(r){lines.push(r.map(function(c){return q(cleanText(c,'iso'))}).join(','))});
    return '\ufeff'+lines.join('\r\n')+'\r\n';      // the byte-order mark lets Excel read accents correctly
  };
  NS.tsv=function(m){
    function f(s){return s.replace(/[\t\r\n]+/g,' ')}
    var lines=[m.headers.map(f).join('\t')];
    m.rows.forEach(function(r){lines.push(r.map(function(c){return f(cleanText(c,'iso'))}).join('\t'))});
    return lines.join('\n');
  };

  /* ---- Excel (.xlsx), written directly: a zip of XML files ---- */
  var CRC=(function(){var t=[],c,n,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
  var enc=new TextEncoder();
  function zip(files){
    var now=new Date(),dt=((now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1))&0xFFFF,dd=(((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate())&0xFFFF;
    var parts=[],central=[],offset=0;
    files.forEach(function(f){
      var name=enc.encode(f.name),crc=crc32(f.data),h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);
      h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
      parts.push(new Uint8Array(h.buffer),name,f.data);
      var c=new DataView(new ArrayBuffer(46));
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);
      c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
      central.push(new Uint8Array(c.buffer),name);
      offset+=30+name.length+f.data.length;
    });
    var csize=0;central.forEach(function(p){csize+=p.length});
    var e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csize,true);e.setUint32(16,offset,true);
    var all=parts.concat(central,[new Uint8Array(e.buffer)]),total=0;all.forEach(function(p){total+=p.length});
    var out=new Uint8Array(total),at=0;all.forEach(function(p){out.set(p,at);at+=p.length});return out;
  }
  function esc(s){return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function colName(n){var s='';n++;while(n>0){var r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s}
  function serial(d){return d.getTime()/86400000+25569-d.getTimezoneOffset()/1440}        // Excel stores local clock time as a day count
  function dateSerial(s){var m=DATE_RE.exec(s);return Date.UTC(+m[1],+m[2]-1,+m[3])/86400000+25569}
  var STYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<numFmts count="3"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/><numFmt numFmtId="165" formatCode="yyyy\\-mm\\-dd\\ hh:mm"/><numFmt numFmtId="166" formatCode="&quot;$&quot;#,##0.00"/></numFmts>'+
    '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF231F20"/><name val="Calibri"/></font></fonts>'+
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF231F20"/><bgColor indexed="64"/></patternFill></fill></fills>'+
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="medium"><color rgb="FFF37026"/></bottom><diagonal/></border></borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
    '<cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'+
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left"/></xf>'+
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left"/></xf>'+
    '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'+
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>'+
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  function istr(ref,s,style){s=String(s);return '<c r="'+ref+'"'+(style?' s="'+style+'"':'')+' t="inlineStr"><is><t xml:space="preserve">'+esc(s)+'</t></is></c>'}
  function sheetXml(m){
    var rows=[],widths=m.headers.map(function(h){return Math.min(50,Math.max(8,h.length+4))});
    rows.push('<row r="1" ht="24" customHeight="1">'+m.headers.map(function(h,c){return istr(colName(c)+'1',h,1)}).join('')+'</row>');
    m.rows.forEach(function(r,ri){
      var n=ri+2,xml=r.map(function(c,ci){
        var ref=colName(ci)+n;if(c.v===''||c.v==null)return '';
        if(c.t==='date'){widths[ci]=Math.max(widths[ci],12);return '<c r="'+ref+'" s="2"><v>'+dateSerial(c.v)+'</v></c>'}
        if(c.t==='datetime'){widths[ci]=Math.max(widths[ci],18);return '<c r="'+ref+'" s="3"><v>'+serial(c.v)+'</v></c>'}
        if(c.t==='money'){widths[ci]=Math.max(widths[ci],13);return '<c r="'+ref+'" s="4"><v>'+c.v+'</v></c>'}
        if(c.t==='int')return '<c r="'+ref+'"><v>'+c.v+'</v></c>';
        var s=String(c.v);if(ri<200)widths[ci]=Math.max(widths[ci],Math.min(50,s.length+2));
        return istr(ref,s,0);
      }).join('');
      rows.push('<row r="'+n+'">'+xml+'</row>');
    });
    var last=colName(Math.max(0,m.headers.length-1))+(m.rows.length+1);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><tabColor rgb="FFF37026"/></sheetPr>'+
      '<sheetViews><sheetView workbookViewId="0" tabSelected="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>'+
      '<cols>'+widths.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'}).join('')+'</cols>'+
      '<sheetData>'+rows.join('')+'</sheetData>'+(m.rows.length?'<autoFilter ref="A1:'+last+'"/>':'')+'<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToHeight="0"/></worksheet>';
  }
  function aboutXml(about){
    var rows=[],r=1;
    rows.push('<row r="1" ht="24" customHeight="1">'+istr('A1','LWTC Financial Aid: results export',5)+'</row>');
    (about||[]).forEach(function(p){r++;rows.push('<row r="'+(r+1)+'">'+istr('A'+(r+1),p[0],6)+(p[1]!==''?istr('B'+(r+1),p[1],6):'')+'</row>')});
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="80" customWidth="1"/></cols><sheetData>'+rows.join('')+'</sheetData></worksheet>';
  }
  NS.xlsx=function(m,about){
    var X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',u=function(s){return enc.encode(s)};
    return zip([
      {name:'[Content_Types].xml',data:u(X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')},
      {name:'_rels/.rels',data:u(X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')},
      {name:'xl/workbook.xml',data:u(X+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Submissions" sheetId="1" r:id="rId1"/><sheet name="About this export" sheetId="2" r:id="rId2"/></sheets></workbook>')},
      {name:'xl/_rels/workbook.xml.rels',data:u(X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')},
      {name:'xl/styles.xml',data:u(STYLES)},
      {name:'xl/worksheets/sheet1.xml',data:u(sheetXml(m))},
      {name:'xl/worksheets/sheet2.xml',data:u(aboutXml(about))}
    ]);
  };

  /* ---- download ---- */
  NS.download=function(data,filename,mime){
    var blob=data instanceof Blob?data:new Blob([data],{type:mime||'application/octet-stream'});
    var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(url);a.remove()},4000);
  };
  NS.fileName=function(scope,ext){var d=new Date();return 'LWTC-'+String(scope||'results').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'')+'-'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'.'+ext};

  /* ---- branded PDF: a report laid out for the printer; the browser saves it as a PDF ---- */
  NS.printReport=function(m,meta){
    meta=meta||{};
    var host=document.getElementById('exportSheet');if(host)host.remove();
    host=document.createElement('div');host.id='exportSheet';
    function E(tag,cls,t){var e=document.createElement(tag);if(cls)e.className=cls;if(t!=null)e.textContent=t;return e}
    var head=E('div','x-head'),logo=E('img','x-logo');logo.src=base+'lwtc-logo.png';logo.alt='';logo.decoding='sync';head.appendChild(logo);
    var right=E('div','x-meta');right.appendChild(E('b',null,'Financial Aid Office'));right.appendChild(E('span',null,'Exported '+new Date().toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})));if(meta.by)right.appendChild(E('span',null,'by '+meta.by));head.appendChild(right);host.appendChild(head);
    var rule=E('div','x-rule');for(var k=0;k<4;k++)rule.appendChild(E('i'));host.appendChild(rule);
    host.appendChild(E('h1','x-title',meta.title||'Form results'));
    var sub=E('div','x-sub');
    sub.appendChild(E('span',null,m.rows.length+(m.rows.length===1?' submission':' submissions')));
    if(meta.scope)sub.appendChild(E('span',null,meta.scope));
    if(meta.sort)sub.appendChild(E('span',null,'Sorted: '+meta.sort));
    host.appendChild(sub);
    if(meta.filters&&meta.filters.length){var fl=E('div','x-filters');fl.appendChild(E('b',null,'Filters: '));fl.appendChild(document.createTextNode(meta.filters.join(' \u00b7 ')));host.appendChild(fl)}
    var n=m.headers.length,size=n<=7?10:n<=10?9:n<=14?8:7;
    var tbl=E('table','x-table');tbl.style.fontSize=size+'pt';
    var thead=E('thead'),hr=E('tr');m.headers.forEach(function(h){hr.appendChild(E('th',null,h))});thead.appendChild(hr);tbl.appendChild(thead);
    var tb=E('tbody'),lastGroup=null;
    m.rows.forEach(function(r,ri){
      var g=meta.groups?meta.groups[ri]:null;
      if(g!==null&&g!==undefined&&g!==lastGroup){lastGroup=g;var gr=E('tr','x-group'),gh=E('th',null,g);gh.colSpan=n;gr.appendChild(gh);tb.appendChild(gr)}
      var tr=E('tr');r.forEach(function(c){tr.appendChild(E('td',c.t==='money'||c.t==='int'?'num':null,text(c,'pretty')))});tb.appendChild(tr);
    });
    if(!m.rows.length){var er=E('tr'),ec=E('td',null,'No submissions match.');ec.colSpan=n;er.appendChild(ec);tb.appendChild(er)}
    tbl.appendChild(tb);host.appendChild(tbl);
    host.appendChild(E('p','x-foot','Lorenzo Walker Technical College \u00b7 Financial Aid Office \u00b7 Confidential: contains student information. Handle and store it according to FERPA and college policy.'));
    document.body.appendChild(host);
    var prev=document.title;document.title=meta.fileTitle||'LWTC results';
    document.body.classList.add('print-export');
    var done=function(){document.title=prev;document.body.classList.remove('print-export');window.removeEventListener('afterprint',done);var h=document.getElementById('exportSheet');if(h)h.remove()};
    window.addEventListener('afterprint',done);
    var fonts=document.fonts&&document.fonts.load?Promise.all(['400 12pt "Alfa Slab One"','400 10pt "Source Sans 3"','700 10pt "Source Sans 3"'].map(function(f){return document.fonts.load(f)})).then(function(){},function(){}):Promise.resolve();
    var img=(logo.decode?logo.decode():Promise.resolve()).then(function(){},function(){});
    return Promise.race([Promise.all([fonts,img]),new Promise(function(r){setTimeout(r,5000)})]).then(function(){window.print()});
  };
})();
