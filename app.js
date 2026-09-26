(function () {
  "use strict";

  var NOT_LISTED = "강의 표 미제시";
  var STORAGE_KEY = "viromap_wrong_questions_v1";

  var families = [
    { family:"Poxviridae", genome:"dsDNA", viruses:["Variola virus","Vaccinia virus","Monkeypox virus","Canarypox virus","Molluscum contagiosum virus"] },
    { family:"Herpesviridae", genome:"dsDNA", viruses:["HSV-1","HSV-2","VZV","EBV","CMV","HHV-6","HHV-7","HHV-8"] },
    { family:"Adenoviridae", genome:"dsDNA", viruses:["Adenovirus"] },
    { family:"Papillomaviridae", genome:"dsDNA", viruses:["Papillomavirus","HPV-16"] },
    { family:"Polyomaviridae", genome:"dsDNA", viruses:["JC virus","BK virus","SV40"] },
    { family:"Parvoviridae", genome:"ssDNA", viruses:["Parvovirus B19","Adeno-associated virus"] },
    { family:"Hepadnaviridae", genome:"dsDNA", viruses:["Hepatitis B virus (HBV)"], note:"부분 이중가닥 DNA이며 reverse transcription을 이용" },
    { family:"Picornaviridae", genome:"+ssRNA", viruses:["Poliovirus","Hepatitis A virus (HAV)"] },
    { family:"Caliciviridae", genome:"+ssRNA", viruses:["Norovirus"] },
    { family:"Hepeviridae", genome:"+ssRNA", viruses:["Hepatitis E virus (HEV)"] },
    { family:"Astroviridae", genome:"+ssRNA", viruses:["Human astrovirus"] },
    { family:"Togaviridae", genome:"+ssRNA", viruses:["Chikungunya virus","Semliki Forest virus"] },
    { family:"Flaviviridae", genome:"+ssRNA", viruses:["Dengue virus","Hepatitis C virus (HCV)"] },
    { family:"Coronaviridae", genome:"+ssRNA", viruses:["SARS-CoV-2"] },
    { family:"Rhabdoviridae", genome:"−ssRNA", viruses:["Rabies virus"] },
    { family:"Filoviridae", genome:"−ssRNA", viruses:["Ebola virus"] },
    { family:"Orthomyxoviridae", genome:"−ssRNA", viruses:["Influenza A virus"] },
    { family:"Paramyxoviridae", genome:"−ssRNA", viruses:["Measles virus"] },
    { family:"Pneumoviridae", genome:"−ssRNA", viruses:["Respiratory syncytial virus (RSV)"] },
    { family:"Hantaviridae", genome:"−ssRNA", viruses:["Hantaan virus"], legacy:"강의 전통 표기: Bunya group" },
    { family:"Arenaviridae", genome:"−ssRNA", viruses:["Lassa virus"], note:"일부 genome segment는 ambisense" },
    { family:"Reoviridae", genome:"dsRNA", viruses:["Reovirus"] },
    { family:"Sedoreoviridae", genome:"dsRNA", viruses:["Rotavirus"], legacy:"VAP 표의 전통 표기: Reoviridae" },
    { family:"Retroviridae", genome:"RNA via DNA", viruses:["HIV-1","Murine leukemia virus"] }
  ];

  var attachments = [
    { virus:"Rhinovirus", vap:"VP1–VP2–VP3 complex", target:"Epithelial cell", receptor:"ICAM-1" },
    { virus:"Adenovirus", vap:"Fiber protein", target:NOT_LISTED, receptor:NOT_LISTED },
    { virus:"Reovirus", vap:"σ1", target:NOT_LISTED, receptor:NOT_LISTED },
    { virus:"Rotavirus", vap:"VP7", target:NOT_LISTED, receptor:NOT_LISTED },
    { virus:"Semliki Forest virus", vap:"E1–E2–E3 glycoprotein complex", target:NOT_LISTED, receptor:NOT_LISTED },
    { virus:"Rabies virus", vap:"G glycoprotein", target:"Neuron", receptor:"Acetylcholine receptor, NCAM" },
    { virus:"Influenza A virus", vap:"HA glycoprotein", target:"Epithelial cell", receptor:"Sialic acid" },
    { virus:"Measles virus", vap:"H glycoprotein", target:NOT_LISTED, receptor:NOT_LISTED },
    { virus:"Epstein–Barr virus", vap:"gp350, gp220", target:"B cell", receptor:"C3d complement receptor (CR2/CD21)" },
    { virus:"Murine leukemia virus", vap:"gp70", target:NOT_LISTED, receptor:NOT_LISTED },
    { virus:"HIV", vap:"gp120", target:"Helper T cell", receptor:"CD4 + CCR5 or CXCR4" },
    { virus:"Poliovirus", vap:NOT_LISTED, target:"Epithelial cell", receptor:"Immunoglobulin superfamily protein" },
    { virus:"Herpes simplex virus", vap:NOT_LISTED, target:"Many cells", receptor:"HVEM (HveA), nectin-1" },
    { virus:"Parvovirus B19", vap:NOT_LISTED, target:"Erythroid precursor", receptor:"Erythrocyte P antigen (globoside)" }
  ];

  var genomeTypes = ["dsDNA","ssDNA","+ssRNA","−ssRNA","dsRNA","RNA via DNA"];
  var state = { questions:[], index:0, score:0, wrong:[], mode:null, review:false, checked:false };
  var el = {};

  function $(id) { return document.getElementById(id); }
  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }
  function sample(list, count) { return shuffle(list).slice(0, Math.max(0, count)); }
  function unique(list) { return list.filter(function (value, index) { return list.indexOf(value) === index; }); }
  function randomInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char];
    });
  }
  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[‐‑‒–—−]/g, "-")
      .replace(/2\s*[′'’]?\s*[-,]?\s*5\s*[′'’]?\s*[-,]?\s*oligo\s*a\s*synthetase/g, "oas")
      .replace(/2\s*[′'’]?\s*[-,]?\s*5\s*[′'’]?\s*[-,]?\s*oligoadenylate\s*synthetase/g, "oas")
      .replace(/oligo\s*a\s*synthetase/g, "oas")
      .replace(/oligoadenylate\s*synthetase/g, "oas")
      .replace(/ribonuclease\s*l/g, "rnasel")
      .replace(/rnase\s*l/g, "rnasel")
      .replace(/protein\s*kinase\s*r/g, "pkr")
      .replace(/glycoprotein/g, "gp")
      .replace(/hemagglutinin/g, "ha")
      .replace(/epstein.?barr virus/g, "ebv")
      .replace(/herpes simplex virus/g, "hsv")
      .replace(/human immunodeficiency virus/g, "hiv")
      .replace(/respiratory syncytial virus/g, "rsv")
      .replace(/hepatitis a virus/g, "hav")
      .replace(/hepatitis b virus/g, "hbv")
      .replace(/hepatitis c virus/g, "hcv")
      .replace(/hepatitis e virus/g, "hev")
      .replace(/c3d complement receptor/g, "cr2")
      .replace(/cd21/g, "cr2")
      .replace(/hvea/g, "hvem")
      .replace(/neural cell adhesion molecule/g, "ncam")
      .replace(/intercellular adhesion molecule.?1/g, "icam1")
      .replace(/not listed|not provided|미기재|미제시|없음/g, "강의표미제시")
      .replace(/[^a-z0-9가-힣+σ]/g, "");
  }
  function acceptedValues(value) {
    var values = [value];
    var extras = {
      "HA glycoprotein":["HA","hemagglutinin"],
      "H glycoprotein":["H protein","H"],
      "G glycoprotein":["G protein","G"],
      "C3d complement receptor (CR2/CD21)":["CR2","CD21","C3d complement receptor"],
      "CD4 + CCR5 or CXCR4":["CD4, CCR5, CXCR4","CD4 + chemokine co-receptor","CD4 + CCR5/CXCR4","CD4 + CCR5","CD4 + CXCR4"],
      "Acetylcholine receptor, NCAM":["ACh receptor, NCAM","acetylcholine receptor and NCAM"],
      "HVEM (HveA), nectin-1":["HVEM, nectin-1","HveA, nectin-1"],
      "Erythrocyte P antigen (globoside)":["P antigen","globoside"],
      "Immunoglobulin superfamily protein":["Ig superfamily protein","immunoglobulin superfamily"],
      "Epithelial cell":["epithelial cells","상피세포"],
      "Helper T cell":["CD4 T cell","CD4+ T cell","보조 T세포"],
      "Erythroid precursor":["erythroid precursors","적혈구계 전구세포"],
      "Many cells":["다양한 세포"],
      "Neuron":["neurons","신경세포"],
      "B cell":["B cells","B세포"],
      "−ssRNA":["-ssRNA","negative-sense ssRNA","negative sense RNA"],
      "+ssRNA":["positive-sense ssRNA","positive sense RNA"],
      "RNA via DNA":["retro RNA","RNA through DNA"]
    };
    if (extras[value]) values = values.concat(extras[value]);
    if (value === NOT_LISTED) values = values.concat(["없음","미제시","미기재","not provided"]);
    var parenthetical = String(value).match(/\(([^)]+)\)/);
    if (parenthetical) values.push(parenthetical[1]);
    return unique(values);
  }
  function answerMatches(input, answers, concepts) {
    var needle = normalize(input);
    var aliasMatch = answers.some(function (answer) {
      var candidate = normalize(answer);
      if (!candidate) return false;
      if (candidate === needle) return true;
      return candidate.length >= 3 && needle.indexOf(candidate) >= 0;
    });
    if (aliasMatch) return true;
    return (concepts || []).some(function (concept) {
      return concept.every(function (alternatives) {
        return alternatives.some(function (keyword) { return needle.indexOf(normalize(keyword)) >= 0; });
      });
    });
  }
  function currentStyle() {
    var input = document.querySelector('input[name="quiz-style"]:checked');
    return input ? input.value : "choice";
  }
  function resolveFormat(style) {
    return style === "mixed" ? (Math.random() < 0.5 ? "choice" : "written") : style;
  }
  function node(value, hidden) {
    return '<span class="node' + (hidden ? ' hidden-node' : '') + '">' + escapeHtml(hidden ? "빈칸" : value) + "</span>";
  }
  function mapping(values, hiddenIndexes) {
    return '<div class="mapping">' + values.map(function (value, index) {
      return node(value, hiddenIndexes.indexOf(index) >= 0) + (index < values.length - 1 ? '<span class="arrow">→</span>' : "");
    }).join("") + "</div>";
  }
  function makeChoice(base, correct, options) {
    base.format = "choice";
    base.correct = unique(correct);
    base.options = shuffle(unique(options));
    base.answerText = base.correct.join(" · ");
    return base;
  }
  function makeSingleIncorrect(question) {
    if (question.format !== "choice") return question;
    var alreadyAsksIncorrect = question.prompt.indexOf("옳지 않은") >= 0;
    var selectedAnswers = question.correct.slice();
    var unselectedAnswers = question.options.filter(function (option) { return selectedAnswers.indexOf(option) < 0; });
    var falseOptions = alreadyAsksIncorrect ? selectedAnswers : unselectedAnswers;
    var trueOptions = alreadyAsksIncorrect ? unselectedAnswers : selectedAnswers;
    if (!falseOptions.length || trueOptions.length < 3) return question;

    var wrongOption = sample(falseOptions, 1)[0];
    question.correct = [wrongOption];
    question.options = shuffle(sample(trueOptions, 3).concat([wrongOption]));
    question.singleChoice = true;
    question.answerText = wrongOption;
    question.prompt = question.prompt
      .replace(/<u>옳지 않은 것<\/u>을 모두 고르세요/g, "<u>옳지 않은 것</u>을 하나 고르세요")
      .replace(/옳은 것을 모두 고르세요/g, "<u>옳지 않은 것</u>을 하나 고르세요")
      .replace(/항바이러스 작용을 모두 고르세요/g, "항바이러스 작용으로 <u>옳지 않은 것</u>을 하나 고르세요");
    return question;
  }
  function makeWritten(base, fields) {
    base.format = "written";
    base.fields = fields;
    base.answerText = fields.map(function (field) { return field.label + ": " + field.display; }).join(" · ");
    return base;
  }

  function antiviralQuestions() {
    var drugBank = ["Acyclovir","Ribavirin","Enfuvirtide","Saquinavir","Remdesivir","Oseltamivir","Amantadine","Type I interferon"];
    var base = { mode:"antiviral", topic:"항바이러스제 · 족보형" };
    var questions = [
      makeChoice(Object.assign({}, base, {
        id:"antiviral:principle",
        direction:"치료 원칙",
        prompt:"항바이러스제의 선택성과 개발상 어려움에 관한 설명 중 <u>옳지 않은 것</u>을 모두 고르세요.",
        clue:"",
        explanation:"바이러스는 숙주 대사를 이용하므로 숙주 기능을 광범위하게 억제하면 선택성이 낮고 독성이 커집니다. 면역결핍 환자에서는 장기간 투여가 필요할 수 있어 독성·내성 부담이 커집니다. Idoxuridine은 독성이 있어 topical로 epithelial herpetic keratitis에 사용된 초기 pyrimidine analog입니다.",
        sourceRef:"강의록 4, 16, 18, 21–24쪽"
      }), [
        "숙주 대사를 광범위하게 억제할수록 바이러스 특이 효소를 겨냥할 때보다 선택성이 높다.",
        "면역결핍 환자에서는 대개 단기간만 투여하므로 장기 독성은 중요한 고려사항이 아니다."
      ], [
        "바이러스가 만드는 효소는 유용한 약물 표적이 될 수 있다.",
        "복제에 중요한 바이러스 구조물도 약물 표적이 될 수 있다.",
        "빠른 돌연변이는 약제 내성을 일으켜 개발을 어렵게 한다.",
        "Idoxuridine은 독성이 있어 topical로 사용된 pyrimidine analog이다.",
        "숙주 대사를 광범위하게 억제할수록 바이러스 특이 효소를 겨냥할 때보다 선택성이 높다.",
        "면역결핍 환자에서는 대개 단기간만 투여하므로 장기 독성은 중요한 고려사항이 아니다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:ti",
        direction:"Therapeutic index",
        prompt:"강의에서 제시한 이상적인 항바이러스제와 therapeutic index에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"TI는 세포 독성을 일으키는 최소 용량을 바이러스에 독성을 일으키는 최소 용량으로 나눈 값입니다. 강의에서는 적어도 100–1000을 효과적인 범위로 제시했습니다.",
        sourceRef:"강의록 17–19쪽"
      }), [
        "물에 잘 녹고 화학적·대사적으로 안정적이어야 한다.",
        "체내에 쉽게 흡수되는 특성이 바람직하다.",
        "Therapeutic index가 클수록 숙주세포와 바이러스 사이의 선택성 여지가 크다.",
        "강의에서는 효과적인 약물의 therapeutic index를 적어도 100–1000으로 제시한다."
      ], [
        "물에 잘 녹고 화학적·대사적으로 안정적이어야 한다.",
        "체내에 쉽게 흡수되는 특성이 바람직하다.",
        "Therapeutic index가 클수록 숙주세포와 바이러스 사이의 선택성 여지가 크다.",
        "강의에서는 효과적인 약물의 therapeutic index를 적어도 100–1000으로 제시한다.",
        "Therapeutic index는 바이러스 독성 최소 용량을 세포 독성 최소 용량으로 나눈 값이다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:ifn-properties",
        direction:"Type I IFN",
        prompt:"Type I interferon의 성질에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Type I IFN은 바이러스 감염 세포에서 만들어져 주변 세포에 항바이러스 상태를 유도하며 바이러스 특이적이지 않습니다. 다만 수용체의 종간 차이 때문에 마우스 IFN은 사람 세포에 효과가 없습니다.",
        sourceRef:"강의록 11–15쪽"
      }), [
        "바이러스 감염 세포에서 만들어져 주변 세포의 항바이러스 단백질 합성을 유도한다.",
        "특정 바이러스 한 종류에만 작용하는 바이러스 특이적 방어물질은 아니다.",
        "종간 수용체 차이 때문에 마우스에서 만든 IFN은 사람 세포에서 항바이러스 효과를 내지 못한다."
      ], [
        "바이러스 감염 세포에서 만들어져 주변 세포의 항바이러스 단백질 합성을 유도한다.",
        "특정 바이러스 한 종류에만 작용하는 바이러스 특이적 방어물질은 아니다.",
        "종간 수용체 차이 때문에 마우스에서 만든 IFN은 사람 세포에서 항바이러스 효과를 내지 못한다.",
        "감염 세포 안에서만 작용하므로 주변의 비감염 세포에는 영향을 주지 않는다.",
        "바이러스 RNA만 선택적으로 분해하고 숙주 RNA에는 영향을 주지 않는다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:ifn-actions",
        direction:"Type I IFN 작용기전",
        prompt:"Type I interferon이 유도하는 항바이러스 작용을 모두 고르세요.",
        clue:"",
        explanation:"PKR은 번역 개시인자를 인산화해 단백질 합성을 막고, 2′-5′-oligo A synthetase는 RNase L 경로를 통해 RNA 분해를 유도합니다. Mx GTPase는 바이러스 유전자 발현과 virion assembly를 억제합니다.",
        sourceRef:"강의록 12쪽"
      }), [
        "PKR 경로를 통한 바이러스 단백질 합성 억제",
        "2′-5′-oligo A synthetase–RNase L 경로를 통한 RNA 분해",
        "Mx GTPase에 의한 바이러스 유전자 발현·virion assembly 억제"
      ], [
        "PKR 경로를 통한 바이러스 단백질 합성 억제",
        "2′-5′-oligo A synthetase–RNase L 경로를 통한 RNA 분해",
        "Mx GTPase에 의한 바이러스 유전자 발현·virion assembly 억제",
        "바이러스 neuraminidase 활성화",
        "M2 proton channel 개방 촉진"
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:enfuvirtide",
        direction:"Entry inhibitor",
        prompt:"Enfuvirtide에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Enfuvirtide(T-20, Fuzeon)는 gp41 유래 peptide로, gp41과 세포막 단백질의 상호작용을 막아 enveloped virus의 membrane fusion을 억제합니다.",
        sourceRef:"강의록 26쪽"
      }), [
        "T-20 또는 Fuzeon으로도 불린다.",
        "gp41 유래 peptide를 이용한다.",
        "gp41과 세포막 단백질의 상호작용을 방해해 membrane fusion을 억제한다."
      ], [
        "T-20 또는 Fuzeon으로도 불린다.",
        "gp41 유래 peptide를 이용한다.",
        "gp41과 세포막 단백질의 상호작용을 방해해 membrane fusion을 억제한다.",
        "M2 proton channel을 막아 uncoating을 억제한다.",
        "Neuraminidase를 억제해 virion release를 막는다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:amantadine",
        direction:"Uncoating inhibitor",
        prompt:"Amantadine의 표적과 작용에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Amantadine은 influenza virus의 M2 H+ channel을 막아 산성화에 따른 구조 변화를 방해하고 uncoating을 억제합니다.",
        sourceRef:"강의록 27쪽"
      }), [
        "Influenza virus의 M2 H+ channel을 표적으로 한다.",
        "바이러스 내부 산성화에 필요한 proton 이동을 방해한다.",
        "바이러스의 uncoating 단계를 억제한다."
      ], [
        "Influenza virus의 M2 H+ channel을 표적으로 한다.",
        "바이러스 내부 산성화에 필요한 proton 이동을 방해한다.",
        "바이러스의 uncoating 단계를 억제한다.",
        "gp41에 결합해 membrane fusion을 억제한다.",
        "숙주세포의 DNA polymerase를 선택적으로 활성화한다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:acyclovir",
        direction:"DNA synthesis inhibitor",
        prompt:"Acyclovir의 선택성과 작용기전에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Acyclovir와 ganciclovir는 guanine analog이며 viral thymidine kinase로 활성화됩니다. Acyclovir는 첫 인산화 뒤 cellular kinase가 활성형을 만들며, 3′-OH가 없어 DNA chain termination을 일으킵니다. 활성형은 세포 효소보다 viral DNA polymerase를 더 잘 억제합니다.",
        sourceRef:"강의록 25, 28–31쪽"
      }), [
        "Guanine analog이며 anti-herpes 약물이다.",
        "Viral thymidine kinase가 첫 번째 인산화를 담당한다.",
        "이후 두 번의 인산화에는 cellular kinase가 관여한다.",
        "3′-OH가 없어 DNA chain termination을 일으킨다.",
        "활성형은 세포 DNA polymerase보다 viral DNA polymerase를 더 강하게 억제한다.",
        "Ganciclovir도 viral thymidine kinase에 의해 활성화되는 guanine analog이다."
      ], [
        "Guanine analog이며 anti-herpes 약물이다.",
        "Viral thymidine kinase가 첫 번째 인산화를 담당한다.",
        "이후 두 번의 인산화에는 cellular kinase가 관여한다.",
        "3′-OH가 없어 DNA chain termination을 일으킨다.",
        "활성형은 세포 DNA polymerase보다 viral DNA polymerase를 더 강하게 억제한다.",
        "Ganciclovir도 viral thymidine kinase에 의해 활성화되는 guanine analog이다.",
        "비감염 세포에서만 선택적으로 활성화된다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:ribavirin",
        direction:"RNA synthesis inhibitor",
        prompt:"Ribavirin에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Ribavirin은 guanosine analog로 시험관에서 RNA polymerase를 비경쟁적으로 억제하고 mRNA 5′ cap 형성을 방해합니다. 강의에서는 RSV의 aerosol 치료와 일부 출혈열에서의 사용을 제시했습니다.",
        sourceRef:"강의록 32쪽"
      }), [
        "Guanosine analog이다.",
        "시험관에서 RNA polymerase의 non-competitive inhibitor로 작용한다.",
        "Nucleic acid base의 guanylation·methylation을 방해해 mRNA 5′ cap 합성을 저해한다.",
        "Respiratory syncytial virus 감염에서 aerosol로 사용할 수 있다."
      ], [
        "Guanosine analog이다.",
        "시험관에서 RNA polymerase의 non-competitive inhibitor로 작용한다.",
        "Nucleic acid base의 guanylation·methylation을 방해해 mRNA 5′ cap 합성을 저해한다.",
        "Respiratory syncytial virus 감염에서 aerosol로 사용할 수 있다.",
        "HIV gp41과 세포막의 결합을 직접 차단한다."
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:hiv-drugs",
        direction:"HIV chemotherapy",
        prompt:"HIV 치료 약물과 작용기전의 연결이 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Saquinavir는 protease inhibitor로 GAG/POL polyprotein 절단과 virion maturation을 방해합니다. AZT는 nucleoside RT inhibitor, nevirapine과 efavirenz는 non-nucleoside RT inhibitor입니다.",
        sourceRef:"강의록 33–35쪽"
      }), [
        "Saquinavir — protease 억제 — 성숙한 감염성 virion 형성 저해",
        "AZT — nucleoside reverse transcriptase inhibitor",
        "Nevirapine — non-nucleoside reverse transcriptase inhibitor",
        "Efavirenz — non-nucleoside reverse transcriptase inhibitor"
      ], [
        "Saquinavir — protease 억제 — 성숙한 감염성 virion 형성 저해",
        "AZT — nucleoside reverse transcriptase inhibitor",
        "Nevirapine — non-nucleoside reverse transcriptase inhibitor",
        "Efavirenz — non-nucleoside reverse transcriptase inhibitor",
        "AZT — neuraminidase inhibitor",
        "Saquinavir — M2 proton channel inhibitor"
      ]),
      makeChoice(Object.assign({}, base, {
        id:"antiviral:influenza",
        direction:"Neuraminidase inhibitor",
        prompt:"Influenza neuraminidase 억제제에 관한 설명 중 옳은 것을 모두 고르세요.",
        clue:"",
        explanation:"Influenza neuraminidase는 점액층 통과와 감염 세포에서의 방출에 필요합니다. Zanamivir는 nasal spray, oseltamivir는 경구 투여하며 둘 다 influenza A와 B에 작용합니다.",
        sourceRef:"강의록 36쪽"
      }), [
        "Zanamivir와 oseltamivir는 influenza A와 B에 작용한다.",
        "Zanamivir는 nasal spray로 투여한다.",
        "Oseltamivir는 경구로 투여한다.",
        "Neuraminidase 억제는 점액층 통과와 새 virion의 세포 탈출을 방해한다."
      ], [
        "Zanamivir와 oseltamivir는 influenza A와 B에 작용한다.",
        "Zanamivir는 nasal spray로 투여한다.",
        "Oseltamivir는 경구로 투여한다.",
        "Neuraminidase 억제는 점액층 통과와 새 virion의 세포 탈출을 방해한다.",
        "Oseltamivir의 주 표적은 viral thymidine kinase이다."
      ]),
      makeWritten(Object.assign({}, base, {
        id:"antiviral:written-enfuvirtide",
        direction:"공통 보기형",
        prompt:"공통 보기에서, gp41과 세포막 단백질의 상호작용을 막아 membrane fusion을 억제하는 약물을 쓰세요.",
        clue:'<div class="clue-box"><b>보기</b> · ' + drugBank.map(escapeHtml).join(" · ") + "</div>",
        explanation:"Enfuvirtide(T-20, Fuzeon)는 gp41 유래 peptide로 HIV의 membrane fusion 단계를 막습니다.",
        sourceRef:"강의록 26쪽"
      }), [{label:"약물",display:"Enfuvirtide",accepted:["Enfuvirtide","T-20","T20","Fuzeon"]}]),
      makeWritten(Object.assign({}, base, {
        id:"antiviral:written-acyclovir",
        direction:"기전 빈칸형",
        prompt:"Acyclovir의 선택적 활성화에 관여하는 효소의 빈칸을 채우세요.",
        clue:'<div class="clue-box">첫 인산화: <b>①</b> → 추가 인산화: <b>②</b><br><b>Chain termination 이유</b> · 3′-OH가 없어 다음 nucleotide가 연결되지 않음</div>',
        explanation:"감염 세포의 viral thymidine kinase가 첫 인산화를 하고 cellular kinase가 두 인산기를 더 붙입니다. 활성형 acyclovir는 3′-OH가 없어 다음 nucleotide가 연결되지 못합니다.",
        sourceRef:"강의록 28–31쪽"
      }), [
        {label:"① 첫 인산화 효소",display:"Viral thymidine kinase",accepted:["Viral thymidine kinase","viral TK","virus thymidine kinase","바이러스 thymidine kinase","바이러스 TK"]},
        {label:"② 추가 인산화 효소",display:"Cellular kinase",accepted:["Cellular kinase","cell kinase","host cell kinase","숙주세포 kinase","세포 kinase"]}
      ]),
      makeWritten(Object.assign({}, base, {
        id:"antiviral:written-amantadine",
        direction:"표적–단계 빈칸형",
        prompt:"Influenza virus의 M2 H+ channel을 막는 약물과 억제되는 증식 단계를 쓰세요.",
        clue:'<div class="clue-box"><b>M2 H+ channel</b> → 약물 ① → 억제 단계 ②</div>',
        explanation:"Amantadine은 M2 proton channel을 막아 바이러스 내부 산성화와 구조 변화를 방해하므로 uncoating이 억제됩니다.",
        sourceRef:"강의록 27쪽"
      }), [
        {label:"① 약물",display:"Amantadine",accepted:["Amantadine","아만타딘"]},
        {label:"② 억제 단계",display:"Uncoating",accepted:["Uncoating","탈외피","탈피각"]}
      ]),
      makeWritten(Object.assign({}, base, {
        id:"antiviral:written-remdesivir",
        direction:"공통 보기형",
        prompt:"공통 보기에서, ribonucleotide analogue로 viral RNA polymerase를 억제하는 약물을 쓰세요.",
        clue:'<div class="clue-box"><b>보기</b> · ' + drugBank.map(escapeHtml).join(" · ") + "</div>",
        explanation:"Remdesivir는 강의에서 ribonucleotide analogue inhibitor of viral RNA polymerase로 제시되었습니다.",
        sourceRef:"강의록 40쪽"
      }), [{label:"약물",display:"Remdesivir",accepted:["Remdesivir","렘데시비르"]}]),
      makeWritten(Object.assign({}, base, {
        id:"antiviral:written-ifn",
        direction:"IFN 기전 빈칸형",
        prompt:"Type I interferon이 유도하는 세 가지 항바이러스 경로의 빈칸을 채우세요.",
        clue:'<div class="clue-box">① → 단백질 합성 억제 · ② → RNA 분해 · ③ → viral gene expression/virion assembly 억제</div>',
        explanation:"Type I IFN은 PKR, 2′-5′-oligo A synthetase–RNase L, Mx GTPase 경로를 유도해 서로 다른 단계에서 바이러스 복제를 억제합니다.",
        sourceRef:"강의록 12쪽"
      }), [
        {label:"①",display:"PKR",accepted:["PKR","protein kinase R"]},
        {label:"②",display:"OAS–RNase L",accepted:["OAS","RNase L","OAS-RNase L","OAS/RNase L","OAS pathway","RNase L pathway","2,5-oligo A synthetase-RNase L","2'-5' oligo A synthetase-RNase L","2′-5′-oligo A synthetase–RNase L","2-5 OAS RNase L","2'5' oligoadenylate synthetase RNase L"],concepts:[[["oas","oligoadenylatesynthetase","oligoasynthetase"]],[ ["rnasel"] ]]},
        {label:"③",display:"Mx GTPase",accepted:["Mx GTPase","Mx GTPases","Mx protein"]}
      ])
    ];
    return shuffle(questions.map(makeSingleIncorrect));
  }

  function taxonomyQuestions(style) {
    var questions = [];
    var allFamilyNames = families.map(function (item) { return item.family; });
    var allViruses = unique([].concat.apply([], families.map(function (item) { return item.viruses; })));

    genomeTypes.forEach(function (genome) {
      var matching = families.filter(function (item) { return item.genome === genome; }).map(function (item) { return item.family; });
      var forward = Math.random() < 0.5;
      var format = resolveFormat(style);
      var base = {
        id:"genome:" + genome,
        mode:"taxonomy",
        topic:"유전체형 ↔ Family",
        direction:forward ? "Genome → Family" : "Family → Genome"
      };
      if (format === "choice" && forward) {
        var genomeChoiceCount = randomInt(1, Math.min(3, matching.length));
        var choiceFamilies = sample(matching, genomeChoiceCount);
        questions.push(makeChoice(Object.assign(base, {
          prompt:escapeHtml(genome) + " genome을 갖는 family " + genomeChoiceCount + "개를 고르세요.",
          clue:""
        }), choiceFamilies, choiceFamilies.concat(sample(allFamilyNames.filter(function (name) { return matching.indexOf(name) < 0; }), 5))));
      } else if (format === "choice") {
        questions.push(makeChoice(Object.assign(base, {
          prompt:"다음 family들이 공통으로 갖는 유전체형을 고르세요.",
          clue:'<div class="clue-box"><b>' + matching.map(escapeHtml).join(", ") + "</b></div>"
        }), [genome], genomeTypes));
      } else if (forward) {
        var genomeWrittenCount = randomInt(1, Math.min(3, matching.length));
        var acceptedFamilies = unique([].concat.apply([], matching.map(acceptedValues)));
        var genomeWrittenQuestion = makeWritten(Object.assign(base, {
          prompt:escapeHtml(genome) + " genome을 갖는 family를 " + genomeWrittenCount + "개 쓰세요.",
          clue:""
        }), Array.from({length:genomeWrittenCount}, function (_, index) {
          return { label:"Family " + (index + 1), display:"", accepted:acceptedFamilies };
        }));
        genomeWrittenQuestion.distinctPool = matching.slice();
        genomeWrittenQuestion.answerText = "가능한 정답: " + matching.join(", ");
        questions.push(genomeWrittenQuestion);
      } else {
        questions.push(makeWritten(Object.assign(base, {
          prompt:"제시된 family들의 공통 유전체형을 쓰세요.",
          clue:'<div class="clue-box"><b>' + matching.map(escapeHtml).join(", ") + "</b></div>"
        }), [{ label:"유전체형", display:genome, accepted:acceptedValues(genome) }]));
      }
    });

    families.forEach(function (item) {
      var forward = Math.random() < 0.5;
      var format = resolveFormat(style);
      var base = {
        id:"family:" + item.family,
        mode:"taxonomy",
        topic:"Family ↔ Virus",
        direction:forward ? "Family → Virus" : "Virus → Family"
      };
      var note = [item.legacy, item.note].filter(Boolean).join(" · ");
      if (format === "choice" && forward) {
        var choiceCount = randomInt(1, Math.min(3, item.viruses.length));
        var choiceViruses = sample(item.viruses, choiceCount);
        questions.push(makeChoice(Object.assign(base, {
          prompt:escapeHtml(item.family) + "에 속하는 virus " + choiceCount + "개를 고르세요.",
          clue:""
        }), choiceViruses, choiceViruses.concat(sample(allViruses.filter(function (virus) { return item.viruses.indexOf(virus) < 0; }), 5))));
      } else if (format === "choice") {
        questions.push(makeChoice(Object.assign(base, {
          prompt:"다음 virus들이 속하는 family를 고르세요.",
          clue:'<div class="clue-box"><b>' + item.viruses.map(escapeHtml).join(", ") + "</b>" + (note ? "<br>" + escapeHtml(note) : "") + "</div>"
        }), [item.family], [item.family].concat(sample(allFamilyNames.filter(function (name) { return name !== item.family; }), 5))));
      } else if (forward) {
        var writtenCount = randomInt(1, Math.min(3, item.viruses.length));
        var acceptedViruses = unique([].concat.apply([], item.viruses.map(acceptedValues)));
        var writtenQuestion = makeWritten(Object.assign(base, {
          prompt:escapeHtml(item.family) + "에 속하는 virus를 " + writtenCount + "개 쓰세요.",
          clue:""
        }), Array.from({length:writtenCount}, function (_, index) {
          return { label:"Virus " + (index + 1), display:"", accepted:acceptedViruses };
        }));
        writtenQuestion.distinctPool = item.viruses.slice();
        writtenQuestion.answerText = "가능한 정답: " + item.viruses.join(", ");
        questions.push(writtenQuestion);
      } else {
        questions.push(makeWritten(Object.assign(base, {
          prompt:"제시된 virus들이 속하는 family를 쓰세요.",
          clue:'<div class="clue-box"><b>' + item.viruses.map(escapeHtml).join(", ") + "</b>" + (note ? "<br>" + escapeHtml(note) : "") + "</div>"
        }), [{ label:"Virus family", display:item.family, accepted:acceptedValues(item.family) }]));
      }
    });
    return shuffle(questions);
  }

  function attachmentQuestions(style) {
    var questions = [];
    var viruses = attachments.map(function (item) { return item.virus; });
    attachments.forEach(function (item) {
      var forward = Math.random() < 0.5;
      var format = resolveFormat(style);
      var relations = [
        { key:"vap", label:"VAP", value:item.vap },
        { key:"target", label:"Target cell", value:item.target },
        { key:"receptor", label:"Receptor", value:item.receptor }
      ].filter(function (relation) { return relation.value !== NOT_LISTED; });
      var values = [item.virus].concat(relations.map(function (relation) { return relation.value; }));
      var labels = ["Virus"].concat(relations.map(function (relation) { return relation.label; }));
      var base = {
        id:"attachment:" + item.virus,
        mode:"attachment",
        topic:"Virus ↔ VAP · Target · Receptor",
        direction:forward ? "Virus → Attachment profile" : "Attachment profile → Virus"
      };
      if (format === "choice" && forward) {
        var correct = relations.map(function (relation) { return relation.label + " · " + relation.value; });
        var options = correct.slice();
        relations.forEach(function (relation) {
          var other = sample(unique(attachments.map(function (record) { return record[relation.key]; }).filter(function (value) {
            return value !== NOT_LISTED && value !== relation.value;
          })), 1)[0];
          if (other) options.push(relation.label + " · " + other);
        });
        questions.push(makeChoice(Object.assign(base, {
          prompt:escapeHtml(item.virus) + "에 대한 옳은 관계를 모두 고르세요.",
          clue:""
        }), correct, options));
      } else if (format === "choice") {
        questions.push(makeChoice(Object.assign(base, {
          prompt:"다음 attachment profile에 해당하는 virus를 고르세요.",
          clue:mapping(relations.map(function (relation) { return relation.value; }), [])
        }), [item.virus], [item.virus].concat(sample(viruses.filter(function (virus) { return virus !== item.virus; }), 5))));
      } else {
        var hidden = [];
        var relationIndexes = relations.map(function (_, index) { return index + 1; });
        if (forward) {
          hidden = sample(relationIndexes, randomInt(1, Math.min(3, relationIndexes.length)));
        } else {
          hidden = [0].concat(sample(relationIndexes, randomInt(0, Math.min(2, Math.max(0, relationIndexes.length - 1)))));
        }
        questions.push(makeWritten(Object.assign(base, {
          prompt:"강의에 제시된 virus attachment 관계의 빈칸을 채우세요.",
          clue:mapping(values, hidden)
        }), hidden.map(function (index) {
          return { label:labels[index], display:values[index], accepted:acceptedValues(values[index]) };
        })));
      }
    });
    return shuffle(questions);
  }

  function loadWrong() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      var cleaned = parsed.filter(function (question) {
        return !(question && question.mode === "attachment" && JSON.stringify(question).indexOf(NOT_LISTED) >= 0);
      });
      if (cleaned.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    } catch (error) { return []; }
  }
  function saveWrong(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (error) {}
    updateWrongCount();
  }
  function upsertWrong(question) {
    var list = loadWrong().filter(function (item) { return item.id !== question.id; });
    list.push(question);
    saveWrong(list);
  }
  function removeWrong(id) {
    saveWrong(loadWrong().filter(function (item) { return item.id !== id; }));
  }
  function updateWrongCount() {
    var count = loadWrong().length;
    el.wrongCount.textContent = String(count);
    el.wrongShortcut.disabled = count === 0;
    el.wrongShortcut.setAttribute("aria-label", count ? "저장된 오답 " + count + "개 복습" : "저장된 오답 없음");
  }

  function showSection(name) {
    el.home.classList.toggle("hidden", name !== "home");
    el.quiz.classList.toggle("active", name === "quiz");
    el.summary.classList.toggle("active", name === "summary");
    window.scrollTo({top:0, behavior:"smooth"});
  }
  function startQuiz(mode, style) {
    state.mode = mode;
    state.review = false;
    state.questions = mode === "taxonomy"
      ? taxonomyQuestions(style || currentStyle())
      : mode === "attachment"
        ? attachmentQuestions(style || currentStyle())
        : antiviralQuestions();
    state.index = 0; state.score = 0; state.wrong = []; state.checked = false;
    showSection("quiz");
    renderQuestion();
  }
  function startWrongReview(questions) {
    var list = questions || loadWrong();
    if (!list.length) { showSection("home"); return; }
    state.mode = "review";
    state.review = true;
    state.questions = shuffle(list);
    state.index = 0; state.score = 0; state.wrong = []; state.checked = false;
    showSection("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    var question = state.questions[state.index];
    state.checked = false;
    el.questionIndex.textContent = String(state.index + 1);
    el.questionTotal.textContent = String(state.questions.length);
    var pct = state.questions.length ? (state.index / state.questions.length) * 100 : 0;
    el.progressFill.style.width = pct + "%";
    el.progress.parentElement.setAttribute("aria-valuenow", String(Math.round(pct)));
    el.questionFormat.textContent = question.format === "choice"
      ? (question.singleChoice ? "객관식 · 틀린 보기 1개" : "객관식 · 모두 고르기")
      : "서술형 · 빈칸 채우기";
    el.questionDirection.textContent = question.topic + " · " + question.direction;
    el.questionText.innerHTML = question.prompt;
    el.questionClue.innerHTML = question.clue || "";
    el.feedback.className = "feedback";
    el.feedback.innerHTML = "";
    el.submitAnswer.style.display = "inline-block";
    el.submitAnswer.disabled = false;
    el.nextQuestion.classList.remove("show");
    el.answers.innerHTML = "";

    if (question.format === "choice") {
      question.options.forEach(function (option, index) {
        var label = document.createElement("label");
        label.className = "option-label";
        label.innerHTML = '<input type="' + (question.singleChoice ? "radio" : "checkbox") + '" name="option" value="' + escapeHtml(option) + '"><span>' + escapeHtml(option) + "</span>";
        el.answers.appendChild(label);
        if (index === 0) setTimeout(function () { label.querySelector("input").focus(); }, 0);
      });
    } else {
      var grid = document.createElement("div");
      grid.className = "blank-grid";
      question.fields.forEach(function (field, index) {
        var wrapper = document.createElement("div");
        wrapper.className = "blank-field";
        wrapper.innerHTML = '<label for="blank-' + index + '">' + escapeHtml(field.label) + '</label><input id="blank-' + index + '" name="blank-' + index + '" autocomplete="off" spellcheck="false" placeholder="답 또는 핵심 설명을 입력하세요">';
        grid.appendChild(wrapper);
      });
      el.answers.appendChild(grid);
      setTimeout(function () {
        var first = el.answers.querySelector("input");
        if (first) first.focus();
      }, 0);
    }
  }

  function gradeCurrent() {
    if (state.checked) return;
    var question = state.questions[state.index];
    var correct = false;
    if (question.format === "choice") {
      var selected = Array.prototype.slice.call(el.answers.querySelectorAll("input:checked")).map(function (input) { return input.value; });
      if (!selected.length) {
        el.feedback.className = "feedback show bad";
        el.feedback.textContent = "보기를 하나 이상 선택하세요.";
        return;
      }
      correct = question.singleChoice
        ? selected.length === 1 && selected[0] === question.correct[0]
        : selected.length === question.correct.length && question.correct.every(function (answer) { return selected.indexOf(answer) >= 0; });
      Array.prototype.slice.call(el.answers.querySelectorAll(".option-label")).forEach(function (label) {
        var input = label.querySelector("input");
        input.disabled = true;
        label.classList.add("disabled");
        if (question.correct.indexOf(input.value) >= 0) label.classList.add("correct");
        else if (input.checked) label.classList.add("wrong");
      });
    } else {
      var inputs = Array.prototype.slice.call(el.answers.querySelectorAll("input"));
      if (inputs.some(function (input) { return !input.value.trim(); })) {
        el.feedback.className = "feedback show bad";
        el.feedback.textContent = "모든 빈칸을 채워주세요.";
        return;
      }
      correct = true;
      var seenAnswers = [];
      inputs.forEach(function (input, index) {
        var normalizedInput = normalize(input.value);
        var isDuplicate = Boolean(question.distinctPool) && seenAnswers.indexOf(normalizedInput) >= 0;
        var fieldCorrect = answerMatches(input.value, question.fields[index].accepted, question.fields[index].concepts) && !isDuplicate;
        seenAnswers.push(normalizedInput);
        input.classList.add(fieldCorrect ? "correct" : "wrong");
        input.disabled = true;
        if (!fieldCorrect) correct = false;
      });
    }
    state.checked = true;
    var detail = question.explanation
      ? '<small><b>해설</b> ' + escapeHtml(question.explanation) + (question.sourceRef ? '<br><b>근거</b> ' + escapeHtml(question.sourceRef) : "") + "</small>"
      : "";
    if (correct) {
      state.score += 1;
      removeWrong(question.id);
      el.feedback.className = "feedback show good";
      el.feedback.innerHTML = "정답입니다.<small><b>정답</b> " + escapeHtml(question.answerText) + "</small>" + detail;
    } else {
      state.wrong.push(question);
      upsertWrong(question);
      el.feedback.className = "feedback show bad";
      el.feedback.innerHTML = "오답입니다.<small><b>정답</b> " + escapeHtml(question.answerText) + "</small>" + detail;
    }
    el.submitAnswer.style.display = "none";
    el.nextQuestion.classList.add("show");
    el.nextQuestion.textContent = state.index === state.questions.length - 1 ? "결과 보기 →" : "다음 문제 →";
    el.nextQuestion.focus();
  }

  function nextQuestion() {
    if (!state.checked) return;
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }
  function finishQuiz() {
    var antiviralSession = state.questions.length && state.questions.every(function (question) { return question.mode === "antiviral"; });
    el.progressFill.style.width = "100%";
    el.scoreValue.textContent = String(state.score);
    el.scoreDenominator.textContent = "/ " + state.questions.length;
    el.summaryTitle.textContent = antiviralSession
      ? (state.wrong.length ? "다시 볼 항바이러스제 문항이 있습니다." : "항바이러스제 15문항을 모두 맞혔습니다.")
      : (state.wrong.length ? "확인할 관계가 남았습니다." : "전 범위를 정확히 연결했습니다.");
    el.summaryCopy.textContent = state.wrong.length
      ? "이번 회차에서 틀린 " + state.wrong.length + (antiviralSession ? "개 문항" : "개 관계") + "을 저장했습니다. 바로 다시 풀거나 다음 접속에서 복습할 수 있습니다."
      : (antiviralSession ? "새 회차에서는 같은 범위를 다른 순서로 다시 확인할 수 있습니다." : "이번 회차의 모든 관계를 맞혔습니다. 새 회차에서는 문제 방향과 형식이 다시 섞입니다.");
    el.summaryMark.textContent = state.wrong.length ? "!" : "✓";
    el.retryWrong.style.display = state.wrong.length ? "inline-block" : "none";
    el.wrongList.innerHTML = state.wrong.map(function (question) {
      return '<div class="wrong-item"><b>' + escapeHtml(question.topic) + '</b><span>' + escapeHtml(question.answerText) + "</span></div>";
    }).join("");
    showSection("summary");
  }

  function bindEvents() {
    document.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () { startQuiz(button.getAttribute("data-mode"), currentStyle()); });
    });
    el.answerForm.addEventListener("submit", function (event) { event.preventDefault(); gradeCurrent(); });
    el.nextQuestion.addEventListener("click", nextQuestion);
    el.back.addEventListener("click", function () { showSection("home"); });
    el.brandHome.addEventListener("click", function () { showSection("home"); });
    el.newSession.addEventListener("click", function () { showSection("home"); });
    el.retryWrong.addEventListener("click", function () { startWrongReview(state.wrong); });
    el.wrongShortcut.addEventListener("click", function () { startWrongReview(); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && state.checked && el.quiz.classList.contains("active")) {
        event.preventDefault(); nextQuestion();
      }
    });
  }

  function registerWebMCP() {
    var context = document.modelContext;
    if (!context || !context.registerTool) return;
    try {
      context.registerTool({
        name:"start_virology_quiz",
        title:"바이러스 관계 퀴즈 시작",
        description:"화면에서 유전체·분류, 바이러스 부착 관계 또는 항바이러스제 족보형 퀴즈를 시작합니다.",
        inputSchema:{
          type:"object",
          properties:{
            mode:{type:"string",enum:["taxonomy","attachment","antiviral"]},
            style:{type:"string",enum:["choice","written","mixed"]}
          },
          required:["mode","style"],
          additionalProperties:false
        },
        annotations:{readOnlyHint:false,untrustedContentHint:false},
        execute:function (input) {
          if (!input || ["taxonomy","attachment","antiviral"].indexOf(input.mode) < 0 || ["choice","written","mixed"].indexOf(input.style) < 0) {
            throw new Error("지원하지 않는 mode 또는 style입니다.");
          }
          startQuiz(input.mode,input.style);
          return {mode:input.mode,style:input.style,totalQuestions:state.questions.length};
        }
      });
      context.registerTool({
        name:"read_virology_quiz_status",
        title:"퀴즈 상태 읽기",
        description:"현재 보이는 퀴즈의 진행 상태와 저장된 오답 수를 읽습니다.",
        inputSchema:{type:"object",properties:{},additionalProperties:false},
        annotations:{readOnlyHint:true,untrustedContentHint:false},
        execute:function () {
          return {mode:state.mode,index:state.index,total:state.questions.length,score:state.score,savedWrong:loadWrong().length};
        }
      });
    } catch (error) {}
  }

  function init() {
    [
      "home","quiz","summary","wrong-count","wrong-shortcut","taxonomy-total","attachment-total","antiviral-total",
      "brand-home","back","question-index","question-total","progress-fill","question-format",
      "question-direction","question-text","question-clue","answer-form","answers","feedback",
      "submit-answer","next-question","summary-mark","summary-title","score-value",
      "score-denominator","summary-copy","retry-wrong","new-session","wrong-list"
    ].forEach(function (id) {
      var key = id.replace(/-([a-z])/g, function (_, char) { return char.toUpperCase(); });
      el[key] = $(id);
    });
    el.progress = el.progressFill;
    el.taxonomyTotal.textContent = String(genomeTypes.length + families.length);
    el.attachmentTotal.textContent = String(attachments.length);
    el.antiviralTotal.textContent = String(antiviralQuestions().length);
    updateWrongCount();
    bindEvents();
    registerWebMCP();
    window.__viromap = {
      families:families,
      attachments:attachments,
      taxonomyQuestions:taxonomyQuestions,
      attachmentQuestions:attachmentQuestions,
      antiviralQuestions:antiviralQuestions,
      normalize:normalize
    };
  }

  init();
}());
