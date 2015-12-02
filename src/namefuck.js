var namefuck = {
  parse: parse,
  build: build,
  pprocess: pprocess,
  compile: compile
};
module.exports = namefuck;

//utility functions
function jsonClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function parse(str) {
  var comment = false;
  var symbols = [];
  var symdic = {};
  var out = [];
  function getc(c) {
    return c.charCodeAt();
  }
  var endl = getc('\n'),
    semi = getc(';'), perc = getc('%'),
    ca = getc('a'), cz = getc('z'),
    cA = getc('A'), cZ = getc('Z')
    c0 = getc('0'), c9 = getc('9');
  
  var wasL = false;
  var starti, cursym, adjust;
  for(var i=0; i<=str.length; i++) {
    var c = str.charCodeAt(i);
    
    var isL = c>=ca && c<=cz  ||  c>=cA && c<=cZ ||  c>=c0 && c<=c9;
    
    if(comment) {
      if(c===endl || c!==c) {
        comment = false;
        out.push({
          i: starti,
          len: i-starti+1,
          com: true
        })
      }
    } else {
      if(c===semi) {
        comment = true;
        starti = i;
      }
      if(isL) {
        if(!wasL) {
          cursym = str[i];
          starti = i;
          if(str.charCodeAt(i-1) == perc) {
            adjust = true;
            starti--;
          }
        } else {
          cursym += str[i];
        }
      } else {
        if(wasL) {
          if(!symdic[cursym]) {
            symdic[cursym] = true;
            symbols.push(cursym);
          }
          out.push({
            i: starti,
            len: i-starti,
            sym: cursym,
            adj: adjust
          })
        }
        adjust = false;
      }
    }
    
    wasL = isL;
  }
  return {
    symbols: symbols,
    out: out
  }
}

function naiveAdr(symbols, out) {
  var ret = {};
  for(var i=0; i < symbols.length; i++) {
    ret[symbols[i]] = i;
  }
  return ret;
}

function build(str, adr) {
  var p = parse(str);
  var out = p.out;
  var adrs = (adr || naiveAdr)(p.symbols, p.out);
  var lastadr = 0;
  var ret = '';
  var last = 0;
  for(var i=0; i<out.length; i++) {
    var sym = out[i];
    ret += str.substring(last, sym.i); //append each non-symbol string
    if(!sym.com) {
      var newadr = adrs[sym.sym];
      //append the right number of shifts
      if(!sym.adj) {
        var shift = newadr >= lastadr ? '>' : '<';
        var count = Math.abs(newadr-lastadr);
        for(var j=0; j<count; j++) ret+=shift;
      }
      
      lastadr = newadr;
    }
    last = sym.i+sym.len;
  }
  ret += str.substring(last, str.length);
  return ret;
}

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function gtmp(state) {
  var i = state.tmp || 0;
  state.tmp = i+1;
  return 'ptmp'+i;
}
function mov(state, a, b) {
  return '{0}[-]{1}[{0}+{1}-]'.format(a, b);
}
function cop(state, a, b) {
  var tmp = 'coptmp';
  return '{0}[-]{1}[{0}+{2}+{1}-]{2}[{1}+{2}-]'.format(a, b, tmp);
}
function whi(state, a) {
  state.ctrl.push(['whi', a]);
  return '{0}['.format(a);
}
function mif(state, a) {
  var tmp1 = 'iftmp1'+state.ctrl.length;
  var tmp2 = 'iftmp2'+state.ctrl.length;
  state.ctrl.push(['if', tmp1])
  return ('{0}[{1}+{2}+{0}-]'+
          '{2}[{0}+{2}-]'+
          '{1}[').format(a, tmp1, tmp2);
}
function melse(state) {
  var tmp = 'elsetmp'+state.ctrl.length;
  if(state.ctrl[state.ctrl.length-1][0] !== 'if') {
    throw new Exception('else without if');
  }
  var out = '{0}-'+end(state)+'{0}+[';
  state.ctrl.push(['else', tmp]);
  return out.format(tmp);
}
function end(state) {
  var ctrl = state.ctrl.pop();
  var name = ctrl[0]
  if(name === 'whi') {
    return '{0}]'.format(ctrl[1]);
  } else if(name === 'if') {
    return ('{0}[-]'+
            ']'+
            '{0}[-]').format(ctrl[1]);
  } else if(name === 'else') {
    return '{0}-]'.format(ctrl[1]);
  }
}

var ms = namefuck.ms = {
  mov: mov,
  cop: cop,
  whi: whi,
  if: mif,
  else: melse,
  end: end
};

function pprocess(str) {
  
  var state = {
    tmp: 0,
    ctrl: []
  };
  
  var comments = /;[^\n]*(?:\n|$)/g;
  str = str.replace(comments, '');
  
  var reg = /@([a-z]*)(?:\(([a-z,]*)\))?/g;
  var match;
  var lasti = 0;
  var out = '';
  while ((match = reg.exec(str)) !== null) {
    var name = match[1];
    var args = (match[2]||'').split(',');
    var l = match[0].length
    var endi = reg.lastIndex;
    
    out += str.substring(lasti, endi-l);
    args.splice(0, 0, state);
    out += ms[name].apply(null, args);
    
    lasti = endi;
  }
  out += str.substring(lasti, str.length);
  return out;
}
function compile(str) {
  return build(pprocess(str));
}