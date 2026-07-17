#!/bin/bash
# We will insert the Equalization UI right before the closing divs of the Diversity tab.

awk '
/The following action was requested:/ { print; next }
/<\/div>$/ { 
  if (count_divs == 1) {
      print "            <div className=\"mt-8 border-t border-navy-light/60 pt-8\">";
      print "              <h3 className=\"font-bold text-white text-sm tracking-tight uppercase font-mono mb-6 flex items-center gap-2\">";
      print "                <Shuffle className=\"h-4 w-4 text-emerald-400\" /> Zero-Forcing Equalizer";
      print "              </h3>";
      print "              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">";
      print "                <div className=\"bg-navy-dark p-5 rounded-xl border border-navy-light/50\">";
      print "                  <label className=\"block text-xs font-medium text-slate-400 mb-2\">Channel Impulse Response h[n] (comma separated)</label>";
      print "                  <input type=\"text\" value={div.hChannelStr} onChange={e => div.setHChannelStr(e.target.value)} className=\"w-full bg-navy-light text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono\" />";
      print "                  <div className=\"text-[10px] text-slate-500 mt-2\">Example: 0.8, -0.4, 0.2</div>";
      print "                </div>";
      print "                <div className=\"bg-navy-dark p-5 rounded-xl border border-emerald-500/30\">";
      print "                  <label className=\"block text-xs font-medium text-emerald-400/80 mb-2 uppercase tracking-wider font-mono\">Equalizer Taps e[n]</label>";
      print "                  <div className=\"flex flex-wrap gap-2\">";
      print "                    {div.results.eCoeffs.map((coeff, idx) => (";
      print "                      <div key={idx} className=\"bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg font-mono text-sm shadow-[0_0_10px_rgba(16,185,129,0.05)]\">";
      print "                        <span className=\"text-[10px] text-emerald-500/60 mr-1\">e[{idx}]</span> {coeff.toFixed(4)}";
      print "                      </div>";
      print "                    ))}";
      print "                    {div.results.eCoeffs.length === 0 && <span className=\"text-slate-500 text-sm\">Invalid input</span>}";
      print "                  </div>";
      print "                  <div className=\"text-[10px] text-slate-500 mt-3 font-mono\">E(z) = 1 / H(z)</div>";
      print "                </div>";
      print "              </div>";
      print "            </div>";
  }
}
{ print }
'
