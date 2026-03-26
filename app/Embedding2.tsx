// @ts-nocheck
"use client"

import { useState, useEffect, useRef } from "react";
import React from "react";

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function makeEmbedding(text, dims = 8) {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const vec = new Array(dims).fill(0);
  words.forEach((w) => {
    for (let d = 0; d < dims; d++) {
      const seed = hashStr(w + d * 7919);
      vec[d] += ((seed % 2000) / 1000 - 1.0) * 0.6;
    }
  });
  const t = text.toLowerCase();
  const topicBias = (keywords, biasVec) => {
    if (keywords.some(k => t.includes(k))) biasVec.forEach((b, i) => { vec[i] += b; });
  };
  topicBias(["machine learning","ml","neural","deep","model","train"], [1.2, 0.8, -0.3, 0.4, -0.5, 0.9, 0.2, -0.4]);
  topicBias(["python","code","programming","software","developer"],     [-0.3, 1.4, 0.7, -0.5, 0.8, -0.2, 1.1, 0.3]);
  topicBias(["coffee","brew","espresso","cup","drink","cafe"],          [0.2, -0.8, 1.5, 0.6, -1.0, 0.3, -0.7, 1.2]);
  topicBias(["restaurant","food","eat","meal","chef","menu"],           [0.1, -0.5, 1.2, 0.8, -0.8, 0.2, -0.4, 1.0]);
  topicBias(["embedding","vector","semantic","similarity","nlp"],       [1.5, 0.3, -0.6, 1.2, -0.3, 0.7, 0.5, -0.8]);
  topicBias(["fish","fishing","river","lake","stream","rod","bait","catch"], [-0.8, -0.6, 0.4, -1.2, 1.4, -0.5, -0.9, 1.5]);
  topicBias(["deposit","withdraw","account","savings","loan","money","branch","teller"], [0.3, -0.4, -1.0, 1.5, -1.2, 0.8, 1.3, -0.7]);
  topicBias(["iphone","apple","gb","storage","smartphone","unlocked","display","camera"], [0.9, 1.1, -0.4, 0.8, 1.2, -0.6, 0.3, -0.9]);
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map(v => v / (mag || 1));
}

function cosineSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const ma = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const mb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (ma * mb || 1);
}

const DOCS = [
  { id: 0,  text: "Machine learning models learn patterns from training data.", color: "#00C8FF", group: "ML" },
  { id: 1,  text: "Deep learning neural networks train on large datasets.",     color: "#00C8FF", group: "ML" },
  { id: 2,  text: "ML algorithms identify patterns in training examples.",       color: "#00C8FF", group: "ML" },
  { id: 3,  text: "Python is a popular language for data science and ML.",      color: "#FFB340", group: "Code" },
  { id: 4,  text: "Writing Python code for machine learning pipelines.",        color: "#FFB340", group: "Code" },
  { id: 5,  text: "Embedding vectors encode semantic meaning of text.",         color: "#A78BFA", group: "NLP" },
  { id: 6,  text: "Semantic similarity measures how alike two sentences are.",  color: "#A78BFA", group: "NLP" },
  { id: 7,  text: "The espresso machine brews a rich double shot.",             color: "#4ADE80", group: "Food" },
  { id: 8,  text: "A great coffee shop serves freshly roasted beans.",          color: "#4ADE80", group: "Food" },
  { id: 9,  text: "The restaurant menu features seasonal ingredients.",         color: "#FB923C", group: "Food" },
  { id: 10, text: "I went to the bank to fish.",                                color: "#F472B6", group: "Polysemy" },
  { id: 11, text: "I went to the bank to deposit money.",                       color: "#F472B6", group: "Polysemy" },
  { id: 12, text: "Apple iPhone 7 32GB — unlocked smartphone, 4.7\" display.", color: "#34D399", group: "Products" },
  { id: 13, text: "Apple iPhone 7 256GB — unlocked smartphone, 4.7\" display.",color: "#34D399", group: "Products" },
];

const EMBEDDINGS = DOCS.map(d => makeEmbedding(d.text));
const SIM_MATRIX = DOCS.map((_, i) => DOCS.map((_, j) => cosineSim(EMBEDDINGS[i], EMBEDDINGS[j])));
const DIM_LABELS = ["d₁","d₂","d₃","d₄","d₅","d₆","d₇","d₈"];
const GROUP_COLORS = { ML:"#00C8FF", Code:"#FFB340", NLP:"#A78BFA", Food:"#4ADE80", Polysemy:"#F472B6", Products:"#34D399" };

function SectionLabel({ num, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.875rem" }}>
      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.625rem", color:"#00C8FF", background:"rgba(0,200,255,0.1)", border:"1px solid rgba(0,200,255,0.3)", borderRadius:"0.25rem", padding:"0.1875rem 0.5rem", letterSpacing:"0.15em" }}>{num}</span>
      <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"#E2EAF4", letterSpacing:"0.04em" }}>{label}</span>
      <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function TransformerIcon() {
  return (
    <div style={{ width:"2.5rem", height:"2.5rem", borderRadius:"0.5rem", flexShrink:0, background:"linear-gradient(135deg,rgba(0,200,255,0.2),rgba(167,139,250,0.2))", border:"1px solid rgba(0,200,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.125rem" }}>🔄</div>
  );
}

function SpecialBadge({ doc }) {
  if (doc.group === "Polysemy") return (
    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.5rem", color:"#F472B6", background:"rgba(244,114,182,0.15)", border:"1px solid rgba(244,114,182,0.3)", padding:"0.0625rem 0.3125rem", borderRadius:"0.1875rem", flexShrink:0 }}>POLYSEMY</span>
  );
  if (doc.group === "Products") return (
    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.5rem", color:"#34D399", background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", padding:"0.0625rem 0.3125rem", borderRadius:"0.1875rem", flexShrink:0 }}>NEAR-DUP</span>
  );
  return null;
}

export default function EmbeddingLab() {
  const [selected, setSelected] = useState([10, 11]);
  const [threshold, setThreshold] = useState(0.82);
  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState(null);
  const timerRef = useRef(null);

  const sim = cosineSim(EMBEDDINGS[selected[0]], EMBEDDINGS[selected[1]]);
  const isDup = sim >= threshold;
  const vecA = EMBEDDINGS[selected[0]];
  const vecB = EMBEDDINGS[selected[1]];
  const dot = vecA.reduce((s, v, i) => s + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((s, v) => s + v * v, 0));

  function runAnimation() {
    if (animating) return;
    setAnimating(true);
    setActiveStep(0);
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      setActiveStep(step);
      if (step >= 4) { clearInterval(timerRef.current); setAnimating(false); }
    }, 900);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  function selectDoc(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev;
      return [prev[1], id];
    });
    setActiveStep(0);
  }

  const groups = [...new Set(DOCS.map(d => d.group))];

  return (
    <div style={{ background:"#080E1A", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", color:"#E2EAF4", overflowX:"hidden", fontSize: 18 }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px)", backgroundSize:"40px 40px" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:"71.25rem", margin:"0 auto", padding:"2rem 1.5rem 3.75rem" }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem", borderBottom:"1px solid rgba(0,200,255,0.15)", paddingBottom:"1.5rem" }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.625rem", color:"#00C8FF", letterSpacing:"0.2em", marginBottom:"0.5rem", opacity:0.7 }}>EMBEDDING LABORATORY — INTERACTIVE DEMO</div>
          <h1 style={{ fontSize:"1.5rem", fontWeight:600, margin:0, lineHeight:1.2 }}>
            How Transformers Turn Text into Vectors
            <span style={{ color:"#00C8FF" }}> — </span>
            <span style={{ color:"#FFB340" }}>and Make Decisions</span>
          </h1>
          <p style={{ color:"#7A9BB5", fontSize:"0.875rem", marginTop:"0.5rem", maxWidth:"43.75rem", marginBottom:"0.75rem" }}>
            Click any two documents to compare their embeddings. Watch cosine similarity decide whether to{" "}
            <span style={{ color:"#FF6B6B", fontWeight:600 }}>deduplicate</span> or{" "}
            <span style={{ color:"#4ADE80", fontWeight:600 }}>recommend</span>.
          </p>
          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
            <div onClick={() => { setSelected([10,11]); setActiveStep(0); }} style={{ cursor:"pointer", background:"rgba(244,114,182,0.08)", border:"1px solid rgba(244,114,182,0.35)", borderRadius:"0.5rem", padding:"0.625rem 0.875rem", display:"flex", alignItems:"flex-start", gap:"0.625rem", maxWidth:"21.25rem" }}>
              <span style={{ fontSize:"1.125rem", marginTop:"0.0625rem" }}>🏦</span>
              <div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.625rem", color:"#F472B6", letterSpacing:"0.12em", marginBottom:"0.1875rem" }}>POLYSEMY DEMO — click to load</div>
                <div style={{ fontSize:"0.75rem", color:"#C4D5E8", lineHeight:1.5 }}>"bank" means <em>river bank</em> vs <em>financial bank</em> — transformers resolve ambiguity through context, producing very different vectors.</div>
              </div>
            </div>
            <div onClick={() => { setSelected([12,13]); setActiveStep(0); }} style={{ cursor:"pointer", background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.35)", borderRadius:"0.5rem", padding:"0.625rem 0.875rem", display:"flex", alignItems:"flex-start", gap:"0.625rem", maxWidth:"21.25rem" }}>
              <span style={{ fontSize:"1.125rem", marginTop:"0.0625rem" }}>📱</span>
              <div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.625rem", color:"#34D399", letterSpacing:"0.12em", marginBottom:"0.1875rem" }}>NEAR-DUPLICATE DEMO — click to load</div>
                <div style={{ fontSize:"0.75rem", color:"#C4D5E8", lineHeight:1.5 }}>iPhone 7 32GB vs 256GB — nearly identical listings that differ only in storage. High similarity → deduplication candidate.</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 01 */}
        <SectionLabel num="01" label="ENCODE — Transformer → Embedding Vectors" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.75rem" }}>

          {/* Doc list */}
          <div>
            <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color:"#7A9BB5", letterSpacing:"0.15em", marginBottom:"0.625rem" }}>SELECT TWO DOCUMENTS TO COMPARE ↓</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.1875rem" }}>
              {groups.map(group => (
                <React.Fragment key={group}>
                  <div style={{ fontSize:"0.5625rem", fontFamily:"'Space Mono',monospace", color:GROUP_COLORS[group]+"99", letterSpacing:"0.15em", marginTop:"0.5rem", marginBottom:"0.125rem", paddingLeft:"0.125rem" }}>
                    — {group.toUpperCase()} —
                  </div>
                  {DOCS.filter(d => d.group === group).map(doc => {
                    const isA = selected[0] === doc.id;
                    const isB = selected[1] === doc.id;
                    const simToHovered = hoveredDoc !== null && hoveredDoc !== doc.id ? SIM_MATRIX[hoveredDoc][doc.id] : null;
                    return (
                      <button key={doc.id} onClick={() => selectDoc(doc.id)}
                        onMouseEnter={() => setHoveredDoc(doc.id)}
                        onMouseLeave={() => setHoveredDoc(null)}
                        style={{ background:isA?"rgba(0,200,255,0.12)":isB?"rgba(255,179,64,0.12)":"rgba(255,255,255,0.03)", border:isA?"1px solid rgba(0,200,255,0.5)":isB?"1px solid rgba(255,179,64,0.5)":"1px solid rgba(255,255,255,0.06)", borderRadius:"0.4375rem", padding:"0.4375rem 0.75rem", textAlign:"left", cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        <span style={{ width:"0.4375rem", height:"0.4375rem", borderRadius:"50%", background:doc.color, flexShrink:0 }} />
                        <span style={{ fontSize:"0.71875rem", color:isA?"#00C8FF":isB?"#FFB340":"#C4D5E8", flex:1, lineHeight:1.4 }}>{doc.text}</span>
                        <SpecialBadge doc={doc} />
                        {(isA||isB) && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.5625rem", color:isA?"#00C8FF":"#FFB340", background:isA?"rgba(0,200,255,0.15)":"rgba(255,179,64,0.15)", padding:"0.125rem 0.375rem", borderRadius:"0.1875rem", flexShrink:0 }}>{isA?"A":"B"}</span>}
                        {simToHovered !== null && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.625rem", color:simToHovered>0.82?"#FF6B6B":simToHovered>0.5?"#4ADE80":"#7A9BB5", minWidth:"2.125rem", textAlign:"right", flexShrink:0 }}>{simToHovered.toFixed(2)}</span>}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Vector display */}
          <div>
            <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color:"#7A9BB5", letterSpacing:"0.15em", marginBottom:"0.625rem" }}>EMBEDDING VECTORS (8 DIMENSIONS SHOWN)</div>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.75rem", padding:"1rem 1rem 0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.625rem", marginBottom:"0.875rem", paddingBottom:"0.75rem", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <TransformerIcon />
                <div>
                  <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#E2EAF4" }}>Transformer Encoder</div>
                  <div style={{ fontSize:"0.6875rem", color:"#7A9BB5" }}>Context-aware — same word, different meaning → different vector</div>
                </div>
              </div>

              {(DOCS[selected[0]].group === "Polysemy" || DOCS[selected[0]].group === "Products") && (
                <div style={{ marginBottom:"0.75rem", padding:"0.5rem 0.75rem", borderRadius:"0.4375rem", background:DOCS[selected[0]].group==="Polysemy"?"rgba(244,114,182,0.08)":"rgba(52,211,153,0.08)", border:`1px solid ${DOCS[selected[0]].group==="Polysemy"?"rgba(244,114,182,0.25)":"rgba(52,211,153,0.25)"}` }}>
                  <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color:DOCS[selected[0]].group==="Polysemy"?"#F472B6":"#34D399", marginBottom:"0.1875rem" }}>
                    {DOCS[selected[0]].group==="Polysemy" ? "⚡ POLYSEMY IN ACTION" : "⚡ NEAR-DUPLICATE DETECTION"}
                  </div>
                  <div style={{ fontSize:"0.6875rem", color:"#C4D5E8", lineHeight:1.5 }}>
                    {DOCS[selected[0]].group==="Polysemy"
                      ? "Both sentences share 'went' and 'bank', but context words (fish vs deposit/money) push the vectors into very different regions of semantic space."
                      : "Both listings are almost identical — only storage size differs. Notice how similar the vector shapes are."}
                  </div>
                </div>
              )}

              {[{ vec:vecA, label:"DOC A", col:"#00C8FF", docId:selected[0] }, { vec:vecB, label:"DOC B", col:"#FFB340", docId:selected[1] }].map(({ vec, label, col, docId }) => (
                <div key={label} style={{ marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color:col, marginBottom:"0.4375rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <span>{label}</span>
                    <span style={{ color:"#4A6A85", fontSize:"0.5625rem", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>— {DOCS[docId].text.slice(0,42)}{DOCS[docId].text.length>42?"…":""}</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.1875rem", height:"3.75rem" }}>
                    {vec.map((v, di) => (
                      <div key={di} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"0.125rem" }}>
                        <div style={{ width:"100%", height:"3rem", position:"relative" }}>
                          <div style={{ position:"absolute", top:"50%", left:0, right:0, height:"1px", background:"rgba(255,255,255,0.1)" }} />
                          <div style={{ position:"absolute", [v>=0?"bottom":"top"]:"50%", left:"10%", right:"10%", height:`${Math.abs(v)*46}%`, background:v>=0?`linear-gradient(180deg,${col}CC,${col}33)`:"linear-gradient(0deg,#FF6B6B88,#FF6B6B22)", borderRadius:v>=0?"2px 2px 0 0":"0 0 2px 2px", transition:"height 0.4s ease" }} />
                        </div>
                        <span style={{ fontSize:"0.4375rem", color:"#4A6A85", fontFamily:"'Space Mono',monospace" }}>{DIM_LABELS[di]}</span>
                        <span style={{ fontSize:"0.4375rem", color:v>=0?col+"88":"#FF6B6B88", fontFamily:"'Space Mono',monospace" }}>{v>=0?"+":""}{v.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:"0.625rem", marginTop:"0.125rem" }}>
                <div style={{ fontSize:"0.625rem", color:"#7A9BB5", marginBottom:"0.375rem" }}>Dimension-wise product A×B:</div>
                <div style={{ display:"flex", gap:"0.1875rem" }}>
                  {vecA.map((a, di) => {
                    const prod = a * vecB[di];
                    return (
                      <div key={di} style={{ flex:1 }}>
                        <div style={{ height:"0.625rem", borderRadius:"0.125rem", background:prod>0?`rgba(74,222,128,${Math.min(1,Math.abs(prod)*2.5)})`:`rgba(255,107,107,${Math.min(1,Math.abs(prod)*2.5)})`, transition:"background 0.4s" }} />
                        <div style={{ fontSize:"0.4375rem", color:prod>0?"#4ADE8055":"#FF6B6B55", textAlign:"center", fontFamily:"'Space Mono',monospace", marginTop:"0.125rem" }}>{prod>=0?"+":""}{prod.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize:"0.5625rem", color:"#4A6A85", marginTop:"0.3125rem" }}>
                  <span style={{ color:"#4ADE80" }}>■</span> same direction → adds to dot product &nbsp;
                  <span style={{ color:"#FF6B6B" }}>■</span> opposite → subtracts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 02 */}
        <SectionLabel num="02" label="COMPUTE — Cosine Similarity Step by Step" />
        <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.75rem", padding:"1.25rem", marginBottom:"1.75rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.125rem", flexWrap:"wrap" }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.8125rem", color:"#00C8FF", background:"rgba(0,200,255,0.08)", border:"1px solid rgba(0,200,255,0.2)", borderRadius:"0.5rem", padding:"0.625rem 1rem" }}>
              cos(θ) = <span style={{ color:"#FFB340" }}>A·B</span> / (<span style={{ color:"#FF6B6B" }}>‖A‖</span> × <span style={{ color:"#A78BFA" }}>‖B‖</span>)
            </div>
            <button onClick={runAnimation} style={{ background:animating?"rgba(0,200,255,0.05)":"rgba(0,200,255,0.15)", border:"1px solid rgba(0,200,255,0.4)", color:"#00C8FF", borderRadius:"0.5rem", padding:"0.625rem 1.125rem", cursor:animating?"not-allowed":"pointer", fontFamily:"'Space Mono',monospace", fontSize:"0.6875rem", letterSpacing:"0.1em" }}>
              {animating ? "COMPUTING…" : "▶  ANIMATE STEPS"}
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.625rem" }}>
            {[
              { step:1, label:"Step 1", sub:"Dot Product",  formula:"Σ (Aᵢ × Bᵢ)",                                                 result:`${dot.toFixed(4)}`,  color:"#FFB340" },
              { step:2, label:"Step 2", sub:"Magnitude A",  formula:"√(Σ Aᵢ²)",                                                     result:`${magA.toFixed(4)}`, color:"#FF6B6B" },
              { step:3, label:"Step 3", sub:"Magnitude B",  formula:"√(Σ Bᵢ²)",                                                     result:`${magB.toFixed(4)}`, color:"#A78BFA" },
              { step:4, label:"Step 4", sub:"Final Score",  formula:`${dot.toFixed(3)} / (${magA.toFixed(3)}×${magB.toFixed(3)})`,  result:`${sim.toFixed(4)}`,  color:sim>=threshold?"#4ADE80":"#00C8FF" },
            ].map(({ step, label, sub, formula, result, color }) => {
              const active = activeStep >= step;
              const rgb = { "#FFB340":"255,179,64","#FF6B6B":"255,107,107","#A78BFA":"167,139,250","#4ADE80":"74,222,128","#00C8FF":"0,200,255" }[color];
              return (
                <div key={step} style={{ background:active?`rgba(${rgb},0.08)`:"rgba(255,255,255,0.02)", border:`1px solid ${active?color+"44":"rgba(255,255,255,0.05)"}`, borderRadius:"0.625rem", padding:"0.875rem 0.75rem", transition:"all 0.5s ease", opacity:activeStep===0?1:active?1:0.3 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.5625rem", color, marginBottom:"0.1875rem", letterSpacing:"0.12em" }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize:"0.6875rem", color:"#7A9BB5", marginBottom:"0.5rem" }}>{sub}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.6875rem", color:"#C4D5E8", marginBottom:"0.5rem", wordBreak:"break-all", lineHeight:1.5 }}>{formula}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"1.375rem", fontWeight:700, color:active?color:"#4A6A85", transition:"color 0.5s" }}>{active?result:"?"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 03 */}
        <SectionLabel num="03" label="DECIDE — Threshold Controls the Task" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.5rem" }}>

          {/* Threshold */}
          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.75rem", padding:"1.25rem" }}>
            <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color:"#7A9BB5", letterSpacing:"0.15em", marginBottom:"0.875rem" }}>SIMILARITY THRESHOLD — DRAG TO ADJUST</div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", marginBottom:"0.875rem" }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"2.25rem", fontWeight:700, color:isDup?"#FF6B6B":sim>0.4?"#4ADE80":"#7A9BB5", transition:"color 0.3s" }}>{sim.toFixed(3)}</div>
              <div>
                <div style={{ fontSize:"0.75rem", color:"#7A9BB5" }}>similarity score</div>
                <div style={{ fontSize:"0.6875rem", fontFamily:"'Space Mono',monospace", color:"#7A9BB5" }}>threshold: <span style={{ color:"#FFB340" }}>{threshold.toFixed(2)}</span></div>
              </div>
            </div>
            <div style={{ position:"relative", marginBottom:"0.375rem" }}>
              <div style={{ height:"0.75rem", borderRadius:"0.375rem", background:"rgba(255,255,255,0.08)", position:"relative" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${Math.max(0,Math.min(1,sim))*100}%`, background:`linear-gradient(90deg,#4ADE80,${isDup?"#FF6B6B":"#FFB340"})`, borderRadius:"0.375rem", transition:"width 0.4s,background 0.4s" }} />
                <div style={{ position:"absolute", top:"-0.3125rem", bottom:"-0.3125rem", left:`${threshold*100}%`, transform:"translateX(-50%)", width:"0.1875rem", background:"#FFB340", borderRadius:"0.125rem", boxShadow:"0 0 0.5rem #FFB340" }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.5625rem", color:"#4A6A85", fontFamily:"'Space Mono',monospace", marginTop:"0.25rem" }}>
                <span>0.0</span><span>0.5</span><span>1.0</span>
              </div>
            </div>
            <input type="range" min={0.5} max={0.99} step={0.01} value={threshold} onChange={e=>setThreshold(+e.target.value)} style={{ width:"100%", accentColor:"#FFB340", cursor:"pointer", marginBottom:"1rem" }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem", marginBottom:"0.875rem" }}>
              {[
                { label:"⊘ DEDUPLICATE", desc:`sim ≥ ${threshold.toFixed(2)}`, sub:"Near-identical — remove one",       color:"#FF6B6B", active:isDup,           rgb:"255,107,107" },
                { label:"⊕ RECOMMEND",  desc:`0.4 – ${threshold.toFixed(2)}`, sub:"Related but distinct — surface it", color:"#4ADE80", active:!isDup&&sim>0.4, rgb:"74,222,128"  },
              ].map(({ label, desc, sub, color, active, rgb }) => (
                <div key={label} style={{ borderRadius:"0.5rem", padding:"0.625rem 0.75rem", background:active?`rgba(${rgb},0.12)`:`rgba(${rgb},0.03)`, border:`1px solid ${active?color+"55":color+"18"}`, transition:"all 0.3s" }}>
                  <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color, marginBottom:"0.3125rem" }}>{label}</div>
                  <div style={{ fontSize:"0.6875rem", color:"#7A9BB5", lineHeight:1.6 }}>{desc}<br/>{sub}</div>
                  {active && <div style={{ fontSize:"0.5625rem", color, marginTop:"0.3125rem", fontFamily:"'Space Mono',monospace" }}>◀ CURRENT PAIR</div>}
                </div>
              ))}
            </div>
            <div style={{ padding:"0.625rem 0.75rem", borderRadius:"0.5rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:"0.5625rem", fontFamily:"'Space Mono',monospace", color:"#7A9BB5", marginBottom:"0.4375rem", letterSpacing:"0.1em" }}>THRESHOLD ZONES</div>
              {[
                { range:`${threshold.toFixed(2)} – 1.0`, label:"Deduplication", color:"#FF6B6B", desc:"Remove duplicate" },
                { range:`0.40 – ${threshold.toFixed(2)}`, label:"Recommendation", color:"#4ADE80", desc:"Surface as related" },
                { range:"0.0 – 0.40", label:"Unrelated", color:"#7A9BB5", desc:"No action" },
              ].map(z => (
                <div key={z.range} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.6875rem", marginBottom:"0.25rem" }}>
                  <span style={{ color:z.color, fontFamily:"'Space Mono',monospace", fontSize:"0.5625rem", minWidth:"5rem" }}>{z.range}</span>
                  <span style={{ color:"#4A6A85", fontSize:"0.5625rem" }}>→</span>
                  <span style={{ color:"#C4D5E8" }}>{z.label}</span>
                  <span style={{ color:"#4A6A85", fontSize:"0.625rem", marginLeft:"auto" }}>{z.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Matrix */}
          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.75rem", padding:"1.125rem" }}>
            <div style={{ fontSize:"0.625rem", fontFamily:"'Space Mono',monospace", color:"#7A9BB5", letterSpacing:"0.15em", marginBottom:"0.75rem" }}>ALL-PAIRS SIMILARITY MATRIX</div>
            <div style={{ overflowX:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:`1.125rem repeat(14,1fr)`, gap:"0.125rem", minWidth:"20rem" }}>
                <div />
                {DOCS.map(d => (
                  <div key={d.id} style={{ height:"1rem", borderRadius:"0.125rem", fontSize:"0.4375rem", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Mono',monospace", color:d.color, background:"rgba(255,255,255,0.04)" }}>{d.id}</div>
                ))}
                {DOCS.map((rowDoc, ri) => (
                  <React.Fragment key={ri}>
                    <div style={{ height:"1.25rem", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.4375rem", fontFamily:"'Space Mono',monospace", color:rowDoc.color }}>{ri}</div>
                    {DOCS.map((_, ci) => {
                      const s = SIM_MATRIX[ri][ci];
                      const isSel = (selected[0]===ri&&selected[1]===ci)||(selected[1]===ri&&selected[0]===ci);
                      const alpha = ri===ci ? 0 : Math.pow(Math.max(0,s),1.8);
                      const isDupCell = ri!==ci && s>=threshold;
                      return (
                        <div key={`${ri}-${ci}`} onClick={()=>ri!==ci&&setSelected([ri,ci])} title={`Doc${ri}↔Doc${ci}: ${s.toFixed(3)}`}
                          style={{ height:"1.25rem", borderRadius:"0.125rem", cursor:ri!==ci?"pointer":"default", background:ri===ci?"rgba(255,255,255,0.05)":isDupCell?`rgba(255,107,107,${alpha*0.9})`:s>0.4?`rgba(74,222,128,${alpha*0.75})`:`rgba(0,200,255,${alpha*0.4})`, border:`1px solid ${isSel?"#FFB340":"transparent"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.375rem", fontFamily:"'Space Mono',monospace", color:ri===ci?"#4A6A85":s>0.55?"#E2EAF4":"#7A9BB5", transition:"all 0.2s" }}>
                          {ri===ci?"—":s.toFixed(2)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ marginTop:"0.5rem", display:"flex", gap:"0.75rem", fontSize:"0.625rem", color:"#7A9BB5", flexWrap:"wrap" }}>
              <span><span style={{ color:"#FF6B6B" }}>■</span> Dedup ≥{threshold.toFixed(2)}</span>
              <span><span style={{ color:"#4ADE80" }}>■</span> Recommend 0.4–{threshold.toFixed(2)}</span>
            </div>
            <div style={{ marginTop:"0.3125rem", fontSize:"0.625rem", color:"#4A6A85", fontStyle:"italic" }}>Click any cell to compare that pair</div>
          </div>
        </div>

        {/* Verdict */}
        <div style={{ borderRadius:"0.75rem", padding:"1.125rem 1.375rem", background:isDup?"rgba(255,107,107,0.08)":sim>0.4?"rgba(74,222,128,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${isDup?"rgba(255,107,107,0.3)":sim>0.4?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.07)"}`, transition:"all 0.4s", display:"flex", alignItems:"center", gap:"1.125rem", flexWrap:"wrap" }}>
          <div style={{ fontSize:"2.125rem" }}>{isDup?"⊘":sim>0.4?"⊕":"○"}</div>
          <div style={{ flex:1, minWidth:"16.25rem" }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"0.8125rem", fontWeight:700, color:isDup?"#FF6B6B":sim>0.4?"#4ADE80":"#7A9BB5", marginBottom:"0.3125rem" }}>
              {isDup?"VERDICT: DEDUPLICATE":sim>0.4?"VERDICT: RECOMMEND":"VERDICT: UNRELATED"}
            </div>
            <div style={{ fontSize:"0.75rem", color:"#C4D5E8", lineHeight:1.7 }}>
              <span style={{ color:"#00C8FF", fontFamily:"'Space Mono',monospace", fontSize:"0.625rem" }}>A:</span> "{DOCS[selected[0]].text}"<br/>
              <span style={{ color:"#FFB340", fontFamily:"'Space Mono',monospace", fontSize:"0.625rem" }}>B:</span> "{DOCS[selected[1]].text}"
            </div>
            <div style={{ fontSize:"0.75rem", color:"#7A9BB5", marginTop:"0.3125rem", lineHeight:1.6 }}>
              {isDup
                ? `Similarity ${sim.toFixed(3)} ≥ threshold ${threshold.toFixed(2)} — these documents say the same thing. Remove one from the index.`
                : sim>0.4
                  ? `Similarity ${sim.toFixed(3)} is below dedup threshold ${threshold.toFixed(2)} but above 0.4 — related but distinct. Surface Doc B when a user reads Doc A.`
                  : `Similarity ${sim.toFixed(3)} is low — different topics. No dedup, no recommendation needed.`}
            </div>
          </div>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"1.875rem", fontWeight:700, color:isDup?"#FF6B6B":sim>0.4?"#4ADE80":"#7A9BB5", transition:"color 0.3s" }}>{sim.toFixed(3)}</div>
            <div style={{ fontSize:"0.5625rem", color:"#7A9BB5", fontFamily:"'Space Mono',monospace", marginTop:"0.1875rem" }}>COSINE SIMILARITY</div>
          </div>
        </div>

      </div>
    </div>
  );
}
