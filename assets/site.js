/* LWTC Student Services: renders the content set on the Site Content page (GET /api/site) into the public pages.
   Used by the home page, custom pages (page/?p=<slug>) and form pages (forms/view/).
   Everything an administrator writes is inserted as text, never as HTML. Text markup supported:
     blank line = new paragraph, "- " at the start of lines = bullet list, **bold**, [label](https://link). */
(function(){
  var S=window.LWTCSite={data:null};
  var BUBBLES={orange:1,green:1,gold:1,blue:1};

  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  S.el=el;

  /** Links an administrator may use: web addresses, mailto:, tel:, pages on this site (/...) and anchors (#...). */
  function safeUrl(u){
    u=String(u||'').trim();
    if(/^https?:\/\/[^\s<>"]{3,490}$/i.test(u)||/^mailto:[^\s@<>"]+@[^\s<>"]+$/i.test(u)||/^tel:[0-9+().\-\s]{7,30}$/i.test(u)||/^\/(?!\/)[^\s<>"]*$/.test(u)||/^#[A-Za-z0-9_-]*$/.test(u))return u;
    return '';
  }
  S.safeUrl=safeUrl;
  function link(label,url,cls){
    var u=safeUrl(url),a=el(u?'a':'span',cls,label);
    if(u){a.href=u;if(/^https?:/i.test(u)&&u.indexOf(location.origin+'/')!==0)a.rel='noopener'}
    return a;
  }
  S.link=link;

  /** **bold** and [label](url) inside one line of text. */
  function inline(parent,text){
    var re=/\*\*(.+?)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g,last=0,m;
    while((m=re.exec(text))){
      if(m.index>last)parent.appendChild(document.createTextNode(text.slice(last,m.index)));
      if(m[1]!=null)parent.appendChild(el('strong',null,m[1]));
      else parent.appendChild(link(m[2],m[3]));
      last=re.lastIndex;
    }
    if(last<text.length)parent.appendChild(document.createTextNode(text.slice(last)));
  }
  /** A block of text -> paragraphs and bullet lists. */
  S.rich=function(text){
    var f=document.createDocumentFragment();
    String(text||'').replace(/\r/g,'').split(/\n{2,}/).forEach(function(chunk){
      chunk=chunk.trim();if(!chunk)return;
      var lines=chunk.split('\n');
      if(lines.every(function(l){return /^\s*[-*]\s+/.test(l)})){
        var ul=el('ul');lines.forEach(function(l){var li=el('li');inline(li,l.replace(/^\s*[-*]\s+/,''));ul.appendChild(li)});f.appendChild(ul);return;
      }
      var p=el('p');lines.forEach(function(l,i){if(i)p.appendChild(el('br'));inline(p,l)});f.appendChild(p);
    });
    return f;
  };

  /** GET /api/site once per page. */
  S.load=function(){
    if(S._p)return S._p;
    S._p=fetch('/api/site',{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(j){
      if(!j||!j.ok)throw new Error('site');S.data=j;return j;
    });
    return S._p;
  };

  function tel(p){return 'tel:'+String(p||'').replace(/[^\d+]/g,'')}
  function officeBox(box,o){
    if(!box||!o)return;box.textContent='';
    box.appendChild(el('strong',null,o.name||''));
    var addr=[o.address1,o.address2].filter(Boolean).join(', ');
    if(addr){box.appendChild(el('br'));box.appendChild(document.createTextNode(addr))}
    if(o.phone||o.hours){
      box.appendChild(el('br'));
      if(o.phone){var a=el('a',null,o.phone);a.href=tel(o.phone);box.appendChild(a)}
      if(o.hours)box.appendChild(document.createTextNode((o.phone?' \u00b7 ':'')+o.hours));
    }
    if(o.email){box.appendChild(el('br'));var m=el('a',null,o.email);m.href='mailto:'+o.email;box.appendChild(m)}
  }
  S.officeBox=officeBox;

  /** Header, banner, navigation and footer, on any public page. opts.root = relative path to the site root. */
  S.chrome=function(d,opts){
    opts=opts||{};var root=opts.root||'./';
    officeBox(document.querySelector('header.top .office'),d.office);
    var homeA=document.querySelector('header.top a[data-home]');if(homeA)homeA.setAttribute('aria-label',(d.general.siteName||'')+' home');
    // banner
    var old=document.getElementById('siteBanner');if(old)old.remove();
    if(d.banner&&d.banner.text){
      var b=el('div','site-banner '+(d.banner.level==='warning'?'warn':'info'));b.id='siteBanner';b.setAttribute('role','status');
      var inner=el('div','site-banner-in');inner.appendChild(S.rich(d.banner.text));b.appendChild(inner);
      var bar=document.querySelector('.bar'),wrap=document.querySelector('.wrap');
      if(bar&&bar.parentNode)bar.parentNode.insertBefore(b,bar.nextSibling);else if(wrap&&wrap.parentNode)wrap.parentNode.insertBefore(b,wrap);else document.body.insertBefore(b,document.body.firstChild);
    }
    // navigation
    var nav=document.getElementById('siteNav');
    if(nav){
      nav.textContent='';var links=d.nav||[];
      if(links.length){
        var home=el('a',null,'Home');home.href=root;nav.appendChild(home);
        links.forEach(function(l){var a=link(l.label,l.url);if(a.tagName==='A'){if(isCurrent(l.url))a.setAttribute('aria-current','page');nav.appendChild(a)}});
        if(!document.querySelector('#siteNav [aria-current]')&&opts.isHome)home.setAttribute('aria-current','page');
        nav.hidden=false;
      }else nav.hidden=true;
    }
    // footer
    var ft=document.getElementById('footText');if(ft)ft.textContent=d.footer.text||'';
    var fl=document.getElementById('footLinks');
    if(fl){
      fl.textContent='';
      (d.footer.links||[]).forEach(function(l){var a=link(l.label,l.url);if(a.tagName==='A')fl.appendChild(a)});
      if(d.footer.showStaffLink!==false){var s=el('a',null,'Staff sign in');s.href=root+'staff/';fl.appendChild(s)}
    }
  };
  function isCurrent(u){
    var x=safeUrl(u);if(!x||x.charAt(0)!=='/')return false;
    try{var t=new URL(x,location.origin);return t.pathname===location.pathname&&t.search===location.search}catch(_){return false}
  }

  /* ---------- sections ---------- */
  function sectionHead(sec,b,tag){
    if(b.title){var h=el(tag||'h2','section',b.title);h.id=b.id+'-title';sec.setAttribute('aria-labelledby',h.id);sec.appendChild(h)}
  }
  function formsBlock(b,d,root){
    var sec=el('section','blk blk-forms');sectionHead(sec,b);
    if(b.text){var t=el('div','section-sub');t.appendChild(S.rich(b.text));sec.appendChild(t)}
    var grid=el('div','forms');sec.appendChild(grid);
    var list=d.forms||[];
    list.forEach(function(f){
      var card=el('article','form-card'+(f.open?'':' closed'));
      var img=el('img');img.alt='';img.setAttribute('aria-hidden','true');img.src=root+'assets/lwtc-bubble-'+(BUBBLES[f.bubble]?f.bubble:'blue')+'.png';
      var body=el('div');
      body.appendChild(el('h3',null,f.title));
      if(f.description)body.appendChild(el('p',null,f.description));
      var meta=el('ul','meta');
      if(f.audience)meta.appendChild(el('li',null,f.audience));
      if(f.minutes)meta.appendChild(el('li',null,'About '+f.minutes+' minute'+(f.minutes===1?'':'s')));
      if(meta.children.length)body.appendChild(meta);
      if(f.open){var go=el('a','btn','Start the form');go.href=root+f.path;go.setAttribute('aria-label','Start the form: '+f.title);body.appendChild(go)}
      else body.appendChild(el('p','closed-note',f.closedMessage||'This form isn\u2019t accepting submissions right now.'));
      card.appendChild(img);card.appendChild(body);grid.appendChild(card);
    });
    var note=list.length?b.moreText:b.emptyText;
    if(note){var m=el('div','more');m.appendChild(S.rich(note));grid.appendChild(m)}
    return sec;
  }
  function textBlock(b){
    var sec=el('section','blk blk-text');sectionHead(sec,b);
    if(b.text){var t=el('div','prose');t.appendChild(S.rich(b.text));sec.appendChild(t)}
    return sec;
  }
  function contactBlock(b,d){
    var sec=el('section','blk blk-contact');var left=el('div');sectionHead(left,b);
    if(left.firstChild)sec.setAttribute('aria-labelledby',left.firstChild.id);
    if(b.text){var t=el('div','prose');t.appendChild(S.rich(b.text));left.appendChild(t)}
    sec.appendChild(left);
    var o=d.office||{},dl=el('dl');
    function row(k,v){if(!v)return;dl.appendChild(el('dt',null,k));var dd=el('dd');if(v.nodeType)dd.appendChild(v);else dd.textContent=v;dl.appendChild(dd)}
    if(o.address1||o.address2){var a=document.createDocumentFragment();a.appendChild(document.createTextNode(o.address1||''));if(o.address1&&o.address2)a.appendChild(el('br'));a.appendChild(document.createTextNode(o.address2||''));row('Visit',a)}
    if(o.phone){var p=el('a',null,o.phone);p.href=tel(o.phone);row('Call',p)}
    if(o.email){var m=el('a',null,o.email);m.href='mailto:'+o.email;row('Email',m)}
    row('Hours',o.hours);
    if(dl.children.length)sec.appendChild(dl);
    return sec;
  }
  function linksBlock(b){
    var sec=el('section','blk blk-links');sectionHead(sec,b);
    if(b.text){var t=el('div','prose');t.appendChild(S.rich(b.text));sec.appendChild(t)}
    var grid=el('div','link-grid');
    (b.links||[]).forEach(function(l){
      var a=link('',l.url,'link-card');a.textContent='';
      a.appendChild(el('strong',null,l.label));if(l.text)a.appendChild(el('span',null,l.text));
      if(a.tagName==='A')grid.appendChild(a);
    });
    sec.appendChild(grid);return sec;
  }
  S.blocks=function(host,blocks,d,opts){
    opts=opts||{};var root=opts.root||'./';
    (blocks||[]).forEach(function(b){
      var sec=b.type==='forms'?formsBlock(b,d,root):b.type==='contact'?contactBlock(b,d):b.type==='links'?linksBlock(b):textBlock(b);
      sec.id=b.id;sec.classList.add('style-'+(b.style||'plain'));host.appendChild(sec);
    });
  };
  /** Page heading area. */
  S.hero=function(host,title,intro,showArt){
    host.textContent='';var hero=el('section','hero');hero.setAttribute('aria-labelledby','pageTitle');
    var txt=el('div'),h=el('h1',null,title);h.id='pageTitle';txt.appendChild(h);
    if(intro){var p=el('div','lede');p.appendChild(S.rich(intro));txt.appendChild(p)}
    hero.appendChild(txt);
    if(showArt){var art=el('div','hero-art');art.setAttribute('aria-hidden','true');hero.appendChild(art)}else hero.classList.add('no-art');
    host.appendChild(hero);
  };
  S.meta=function(title,description){
    document.title=title;
    if(description){var m=document.querySelector('meta[name=description]');if(!m){m=el('meta');m.name='description';document.head.appendChild(m)}m.content=description}
  };
  /** Shows the page once it is drawn (or after 2.5s, so a slow answer never leaves it blank). */
  S.reveal=function(){document.documentElement.classList.remove('site-loading')};
  setTimeout(S.reveal,2500);
})();
