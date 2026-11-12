/* LWTC form runtime: shared by the Financial Responsibility page, the generic form page and the printed form.
   LWTCForm.rich(text)            safe rich text: paragraphs, "- " bullets, **bold**, [text](https://link)
   LWTCForm.qrSvg(url)            a QR code as an <svg> element (or null if the QR library is missing)
   LWTCForm.qrDataUri(url)        the same as a data: address, for <img> and the printed form
   LWTCForm.conditionMet(rule, sources, answered)
   LWTCForm.questions(el, list, opts) / LWTCForm.documents(el, list, opts)   the extra-question and upload blocks */
(function(){
  var NS=window.LWTCForm=window.LWTCForm||{};
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  NS.el=el;

  /* ---------------- rich text (never innerHTML) ---------------- */
  var INLINE=/\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  function inline(parent,text){
    var last=0,m;INLINE.lastIndex=0;
    while((m=INLINE.exec(text))){
      if(m.index>last)parent.appendChild(document.createTextNode(text.slice(last,m.index)));
      if(m[1]!==undefined){var b=document.createElement('strong');b.textContent=m[1];parent.appendChild(b)}
      else{var a=document.createElement('a');a.href=m[3];a.target='_blank';a.rel='noopener noreferrer';a.textContent=m[2];parent.appendChild(a)}
      last=m.index+m[0].length;
    }
    if(last<text.length)parent.appendChild(document.createTextNode(text.slice(last)));
  }
  NS.richInline=function(text){var f=document.createDocumentFragment();inline(f,String(text==null?'':text).replace(/\s*\n\s*/g,' '));return f};
  NS.rich=function(text){
    var frag=document.createDocumentFragment(),ul=null;
    String(text==null?'':text).split(/\n/).forEach(function(line){
      line=line.replace(/\s+$/,'');
      if(!line.trim()){ul=null;return}
      var bm=/^\s*-\s+(.*)$/.exec(line);
      if(bm){if(!ul){ul=document.createElement('ul');frag.appendChild(ul)}var li=document.createElement('li');inline(li,bm[1]);ul.appendChild(li)}
      else{ul=null;var p=document.createElement('p');inline(p,line.trim());frag.appendChild(p)}
    });
    return frag;
  };

  /* ---------------- QR codes ---------------- */
  NS.qrSvgString=function(url){
    if(!window.qrcode||!url)return '';
    var q=window.qrcode(0,'L');q.addData(String(url));q.make();
    var n=q.getModuleCount(),d=[],r,c;
    for(r=0;r<n;r++)for(c=0;c<n;c++)if(q.isDark(r,c))d.push('M'+c+' '+r+'h1v1h-1z');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><rect x="-2" y="-2" width="'+(n+4)+'" height="'+(n+4)+'" fill="#fff"/><path d="'+d.join('')+'" fill="#000"/></svg>';
  };
  NS.qrDataUri=function(url){var s=NS.qrSvgString(url);return s?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s):''};
  NS.qrSvg=function(url){
    var s=NS.qrSvgString(url);if(!s)return null;
    var doc=new DOMParser().parseFromString(s,'image/svg+xml');
    return document.importNode(doc.documentElement,true);
  };

  /* ---------------- conditions ---------------- */
  NS.conditionMet=function(rule,sources,answered){
    if(!rule)return true;
    if(rule.type==='source')return !!(sources&&sources.has&&sources.has(rule.value));
    if(rule.type==='answer')return (answered||{})[rule.question]===rule.equals;
    return true;
  };

  /* ---------------- extra questions ---------------- */
  NS.questions=function(container,list,opts){
    opts=opts||{};container.textContent='';
    var items=[],lastSection=null,grid=null,sectionCount={};
    list.forEach(function(q){sectionCount[q.section]=1});
    var multiSection=Object.keys(sectionCount).length>1;
    list.forEach(function(q,qi){
      if(q.section!==lastSection){
        lastSection=q.section;
        if(multiSection){var h=el('h3','qsec',q.section);container.appendChild(h)}
        grid=el('div','grid');container.appendChild(grid);
      }
      var wrap=el('div','field qfield q-'+q.type);wrap.dataset.qid=q.id;
      var id='q_'+q.id,get,ctrlList=[];
      var lab=el('label',null,q.label);
      if(q.required){var star=el('span','req',' *');star.setAttribute('aria-hidden','true');lab.appendChild(star)}
      function fieldset(){var fs=el('fieldset','qset');var lg=el('legend',null,q.label);if(q.required){var s=el('span','req',' *');s.setAttribute('aria-hidden','true');lg.appendChild(s)}fs.appendChild(lg);return fs}
      var ctrl;
      if(q.type==='text'||q.type==='number'||q.type==='date'){
        lab.htmlFor=id;wrap.appendChild(lab);
        ctrl=el('input');ctrl.id=id;ctrl.type=q.type==='number'?'text':q.type;if(q.type==='number')ctrl.inputMode='decimal';ctrl.maxLength=500;
        get=function(){return ctrl.value.trim()};ctrlList.push(ctrl);
      }else if(q.type==='longtext'){
        lab.htmlFor=id;wrap.appendChild(lab);wrap.className+=' wide';
        ctrl=el('textarea');ctrl.id=id;ctrl.rows=3;ctrl.maxLength=3000;get=function(){return ctrl.value.trim()};ctrlList.push(ctrl);
      }else if(q.type==='select'){
        lab.htmlFor=id;wrap.appendChild(lab);
        ctrl=el('select');ctrl.id=id;var o0=el('option',null,'Choose…');o0.value='';ctrl.appendChild(o0);
        q.options.forEach(function(o){var op=el('option',null,o);op.value=o;ctrl.appendChild(op)});
        get=function(){return ctrl.value};ctrlList.push(ctrl);
      }else{ // radio, yesno, checkboxes
        ctrl=fieldset();wrap.appendChild(ctrl);
        var opts2=q.type==='yesno'?['Yes','No']:q.options,boxes=[],isCheck=q.type==='checkboxes',inner=el('div','qchoices');
        opts2.forEach(function(o,i){
          var l=el('label','chk'),inp=el('input');inp.type=isCheck?'checkbox':'radio';inp.name='q_'+q.id;inp.value=o;inp.id=id+'_'+i;
          l.appendChild(inp);l.appendChild(el('span',null,o));inner.appendChild(l);boxes.push(inp);ctrlList.push(inp);
        });
        ctrl.appendChild(inner);
        get=isCheck?function(){return boxes.filter(function(b){return b.checked}).map(function(b){return b.value})}:function(){var c=boxes.filter(function(b){return b.checked})[0];return c?c.value:''};
      }
      if(ctrl.tagName!=='FIELDSET')wrap.appendChild(ctrl);
      if(q.help){var hint=el('div','hint',q.help);hint.id=id+'_h';wrap.appendChild(hint)}
      wrap.appendChild(el('div','err','Please answer this question.'));
      ctrlList.forEach(function(c){c.addEventListener('input',changed);c.addEventListener('change',changed)});
      grid.appendChild(wrap);
      items.push({q:q,wrap:wrap,get:get,visible:true});
    });
    function answers(){
      var answered={};
      items.forEach(function(it){
        var show=NS.conditionMet(it.q.showWhen,opts.getSources?opts.getSources():new Set(),answered);
        it.visible=show;it.wrap.hidden=!show;
        if(show){var v=it.get();answered[it.q.id]=Array.isArray(v)?v.join(', '):v}
      });
      return answered;
    }
    function changed(e){
      var w=e&&e.target&&e.target.closest?e.target.closest('.qfield'):null;if(w)w.classList.remove('has-error');
      answers();if(opts.onChange)opts.onChange();
    }
    container.hidden=!list.length;
    answers();
    return {
      refresh:answers,
      collect:function(){answers();var out={};items.forEach(function(it){if(it.visible)out[it.q.id]=it.get()});return out},
      validate:function(){
        answers();var first=null,count=0;
        items.forEach(function(it){
          if(!it.visible){it.wrap.classList.remove('has-error');return}
          var v=it.get(),empty=Array.isArray(v)?!v.length:v==='';
          var bad=(it.q.required&&empty)||(it.q.type==='number'&&v!==''&&!isFinite(Number(v)))||(it.q.type==='date'&&v!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(v));
          it.wrap.classList.toggle('has-error',!!bad);
          if(bad){count++;if(!first)first=it.wrap}
        });
        return {ok:count===0,first:first,count:count};
      },
      markBad:function(id){items.forEach(function(it){if(it.q.id===id)it.wrap.classList.add('has-error')});var w=container.querySelector('[data-qid="'+id+'"]');return w}
    };
  };

  /* ---------------- document uploads ---------------- */
  var EXT_OK=/\.(pdf|jpe?g|png)$/i;
  function humanSize(n){return n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB'}
  NS.documents=function(container,docs,opts){
    opts=opts||{};container.textContent='';
    var up=opts.uploads||{available:false};
    if(!up.available||!docs.length){container.hidden=true;return {refresh:function(){},collect:function(){return {}},summary:function(){return []},busy:function(){return false},validate:function(){return {ok:true,count:0}},active:false}}
    var session=null,token=null,items={};
    function api(path,init){init=init||{};init.credentials='same-origin';return fetch(path,init).then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok||j.ok===false){var e=new Error(j.error||('HTTP '+r.status));e.body=j;e.status=r.status;throw e}return j})})}
    function ensureSession(){
      if(session)return Promise.resolve();
      return api('/api/uploads/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({formId:opts.formId})}).then(function(j){session=j.session;token=j.token});
    }
    function errText(e,d){
      var b=e&&e.body||{};
      if(b.error==='type')return 'That file isn\u2019t a PDF, JPG or PNG. Please choose a different file.';
      if(b.error==='too_large')return 'That file is larger than '+(b.maxMB||up.maxMB)+' MB. Please choose a smaller file or a photo at a lower resolution.';
      if(b.error==='too_many_for_doc')return 'You can upload up to '+d.max+' file'+(d.max===1?'':'s')+' here.';
      if(b.error==='too_many')return 'You\u2019ve uploaded the most files allowed for one submission.';
      if(b.error==='token')return 'Your upload session expired. Reload this page and try again.';
      if(b.error==='empty')return 'That file is empty.';
      return 'The file couldn\u2019t be uploaded. Check your connection and try again.';
    }
    var cards=docs.map(function(d){
      var card=el('div','dcard');card.dataset.did=d.id;
      var h=el('h3',null,d.label);if(d.required){var s=el('span','req',' *');s.setAttribute('aria-hidden','true');h.appendChild(s)}card.appendChild(h);
      if(d.help)card.appendChild(el('p','hint',d.help));
      var list=el('ul','dfiles'),msg=el('div','dmsg');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
      var inp=el('input');inp.type='file';inp.accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';inp.className='dinput';inp.id='doc_'+d.id;
      var btn=el('label','btn alt small','Choose a file');btn.htmlFor=inp.id;btn.tabIndex=0;
      btn.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();inp.click()}});
      var note=el('p','hint','PDF, JPG or PNG, up to '+up.maxMB+' MB'+(d.max>1?'. Up to '+d.max+' files.':'.'));
      var err=el('div','err','Please upload this document.');
      card.appendChild(list);card.appendChild(inp);card.appendChild(btn);card.appendChild(note);card.appendChild(msg);card.appendChild(err);
      container.appendChild(card);
      var it={d:d,card:card,list:list,msg:msg,btn:btn,files:[],busy:false,visible:true};items[d.id]=it;
      function draw(){
        list.textContent='';
        it.files.forEach(function(f){
          var li=el('li');li.appendChild(el('span','fname',f.name));li.appendChild(el('span','fsize',' ('+humanSize(f.size)+')'));
          var rm=el('button','link-btn','Remove');rm.type='button';rm.setAttribute('aria-label','Remove '+f.name);
          rm.addEventListener('click',function(){
            api('/api/uploads/'+opts.formId+'/remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:session,token:token,id:f.id})}).catch(function(){}).then(function(){
              it.files=it.files.filter(function(x){return x.id!==f.id});draw();msg.textContent='Removed '+f.name+'.';if(opts.onChange)opts.onChange();
            });
          });
          li.appendChild(rm);list.appendChild(li);
        });
        btn.hidden=it.files.length>=d.max;
      }
      it.draw=draw;
      inp.addEventListener('change',function(){
        var file=inp.files&&inp.files[0];inp.value='';if(!file)return;
        card.classList.remove('has-error');msg.className='dmsg';
        if(!EXT_OK.test(file.name)){msg.className='dmsg bad';msg.textContent='That file isn\u2019t a PDF, JPG or PNG.';return}
        if(file.size>up.maxMB*1048576){msg.className='dmsg bad';msg.textContent='That file is larger than '+up.maxMB+' MB. Please choose a smaller one.';return}
        if(file.size===0){msg.className='dmsg bad';msg.textContent='That file is empty.';return}
        it.busy=true;btn.hidden=true;msg.textContent='Uploading '+file.name+'\u2026';
        ensureSession().then(function(){
          return new Promise(function(resolve,reject){
            var x=new XMLHttpRequest();
            x.open('PUT','/api/uploads/'+opts.formId+'/'+d.id+'?s='+encodeURIComponent(session)+'&t='+encodeURIComponent(token)+'&name='+encodeURIComponent(file.name));
            x.setRequestHeader('Content-Type','application/octet-stream');
            x.upload.onprogress=function(e){if(e.lengthComputable)msg.textContent='Uploading '+file.name+'\u2026 '+Math.round(e.loaded/e.total*100)+'%'};
            x.onload=function(){var j={};try{j=JSON.parse(x.responseText)}catch(_){}if(x.status>=200&&x.status<300&&j.ok)resolve(j);else{var e=new Error(j.error||('HTTP '+x.status));e.body=j;reject(e)}};
            x.onerror=function(){reject(new Error('network'))};
            x.send(file);
          });
        }).then(function(j){
          it.files.push({id:j.id,name:j.name,size:j.size});msg.className='dmsg ok';msg.textContent='Uploaded '+j.name+'.';
        }).catch(function(e){msg.className='dmsg bad';msg.textContent=errText(e,d)}).then(function(){
          it.busy=false;draw();if(opts.onChange)opts.onChange();
        });
      });
      draw();
      return it;
    });
    container.hidden=false;
    function refresh(){
      var answered=opts.getAnswers?opts.getAnswers():{},sources=opts.getSources?opts.getSources():new Set(),any=false;
      cards.forEach(function(it){
        var show=NS.conditionMet(it.d.showWhen,sources,answered);it.visible=show;it.card.hidden=!show;if(show)any=true;
      });
      container.hidden=!any;
    }
    refresh();
    return {
      active:true,refresh:refresh,
      busy:function(){return cards.some(function(it){return it.busy})},
      summary:function(){refresh();var out=[];cards.forEach(function(it){if(it.visible)it.files.forEach(function(f){out.push({label:it.d.label,name:f.name,size:f.size})})});return out},
      collect:function(){
        refresh();var out={documents:[]};
        cards.forEach(function(it){if(it.visible)it.files.forEach(function(f){out.documents.push({docId:it.d.id,uploadId:f.id})})});
        if(out.documents.length){out.uploadSession=session;out.uploadToken=token}
        return out;
      },
      validate:function(){
        refresh();var first=null,count=0;
        cards.forEach(function(it){var bad=it.visible&&it.d.required&&it.files.length===0;it.card.classList.toggle('has-error',bad);if(bad){count++;if(!first)first=it.card}});
        return {ok:count===0,first:first,count:count};
      },
      markBad:function(id){var it=items[id];if(it){it.card.classList.add('has-error');return it.card}return null}
    };
  };

  /* ---------------- config helpers shared by the pages ---------------- */
  NS.enabled=function(list){return (list||[]).filter(function(x){return x.enabled!==false})};
  NS.today=function(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)};
})();
