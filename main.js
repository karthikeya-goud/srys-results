
Chart.register(ChartDataLabels);

const grades = { 10: "O", 9: "A+", 8: "A", 7: "B+", 6: "B", 5: "C", 0: "F" };
const sem_number = 8;
let linegraph = null;
let piegraph=null;
let bargraph=null;
let mixedgraph=null;
const gold_medal=[];


window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rollno").addEventListener("input", rollno_input);
  document.getElementById("rollno-submit").addEventListener("click", rollno_submit);
  document.getElementById("calculate-btn").addEventListener("click", calculate);
  document.getElementById("slider").addEventListener("input", sliderChanged);
  document.getElementById("select-branch").addEventListener("change", select_branch_value);
  document.getElementById("select-year-sem").addEventListener("change", display_scores);
  document.getElementById("search-rollno").addEventListener("input", search_rollno);

  document.getElementById("calculate-btn").addEventListener("click", calculate);
  document.getElementById("slider").addEventListener("input", sliderChanged);
  document.getElementById("select-branch").addEventListener("change", select_branch_value);
  document.getElementById("select-year-sem").addEventListener("change", display_scores);
  document.getElementById("search-rollno").addEventListener("input", search_rollno);
  document.getElementById("sgss").addEventListener('change',check_adjustCheckBox);
  document.getElementById("subjects-list-sem-wise").addEventListener('change',select_subject)
  document.getElementById("select-grade").addEventListener("change",sub_grade_change)
  
  document.getElementById('openModalBtn').addEventListener('click',modalchanged);
  document.getElementById('openModalBtnA').addEventListener('click',modalchangedA);
  document.getElementById('openModalBtnB').addEventListener('click',modalchangedB);
  
});

function rollno_input(event) {
  let value = event.target.value.trim().toUpperCase();
  event.target.value = value;
  if (value.length !== 10) hide_marks();
}

function check_rollno(rollno) {
  return /^(20|21|22)VE(1|5)A(01|03|04|05|66|67)[a-zA-Z0-9][0-9]$/.test(rollno);
}

function is_student_exist(rollno) {
  const branch = parseInt(rollno.substring(6, 8));
  return rollno in students[branch];
}

function rollno_submit() {
  const rollno = document.getElementById("rollno").value.trim();
  const span = document.getElementById("rollno-errors");

  if (rollno.length !== 10) {
    span.textContent = "Enter Valid Rollno";
  } else if (!check_rollno(rollno)) {
    span.textContent = "Incorrect Rollno";
  } else if (!is_student_exist(rollno)) {
    span.textContent = "Student Not Found";
  } else {
    span.textContent = "";
    show(rollno);
    return;
  }

  hide_marks();
}

function show(rollno) {
  show_student_details(rollno);
  linechart(rollno);
  show_sem_selections(rollno);
  display_results(sem_number);
}

function hide_marks() {
  ["student-information", "student-marks"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });
  document.getElementById("score").style.display = "block";
  document.getElementById("estimate-score").style.display = "none";
  document.getElementById("estimate-table").style.display = "none";
}

function sem_numbering(sem) {
  return {
    semester1: "I-I", semester2: "I-II", semester3: "II-I", semester4: "II-II",
    semester5: "III-I", semester6: "III-II", semester7: "IV-I", semester8: "IV-II"
  }[sem];
}

function get_all_sgpa(branch, id, last_sem) {
  let data = [], label = [], cgpa;
  for (let k in students[branch][id]) {
    if (["name", "section"].includes(k)) continue;
    if (k === "cgpa") { cgpa = students[branch][id][k]; continue; }
    if (id.startsWith("22") && ["semester1", "semester2"].includes(k)) continue;
    if (parseInt(k[8]) > last_sem) continue;
    label.push(sem_numbering(k));
    data.push(parseFloat(students[branch][id][k]));
  }
  return [data, label, cgpa];
}

function linechart(id) {
  const branch = parseInt(id.substring(6, 8));
  const [data, labels, cgpa] = get_all_sgpa(branch, id, sem_number);
  set_cgpa(cgpa);
  show_linechart(data, labels);
}

function show_linechart(data, labels) {
  if (linegraph) linegraph.destroy();
  linegraph = new Chart(document.getElementById('linechart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Semester-wise SGPA',
        data,
        borderColor: 'rgb(255, 193, 7)',
        borderWidth: 2,
        fill: false,
        pointBackgroundColor: 'white'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: "white" }},
        y: { beginAtZero: true, min: 5, ticks: { color: "white" }}
      },
      plugins: {
        legend: { labels: { color: 'white' }},
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: 'white',
          font: { weight: 'bold' },
          formatter: value => value.toFixed(2)
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function class_awarded(cgpa){
  if(cgpa>=7.50) return "FIRST CLASS WITH DISTINCTION";
  else if(cgpa>=6.50) return "FIRST CLASS";
  else if(cgpa>=5.50) return "SECOND CLASS";
  else if(cgpa>=5.00) return "PASS CLASS";
  return "----";
}
function set_cgpa(value) {
  const cgpaEl = document.getElementById("cgpa");
  const percentage=document.getElementById("percentage");
  document.getElementById('class-awarded').textContent=class_awarded(value);
  cgpaEl.textContent = value;
  percentage.textContent= value>0?((value-0.5)*10).toFixed(2)+" %":"0 %";
  const wrapperId = "estimate-wrapper";
  const existing = document.getElementById(wrapperId);
  if (existing) existing.remove();

  if (value === 0) {
    const container = document.getElementById("add-group");
    const wrapper = document.createElement("span");
    wrapper.id = wrapperId;
    wrapper.className = "d-flex align-items-center ms-2";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = "estimate";
    input.className = "form-check-input me-2";
    input.addEventListener("change", estimate_marks);

    const label = document.createElement("label");
    label.setAttribute("for", "estimate");
    label.textContent = "Estimate Marks";
    label.className = "form-check-label";

    wrapper.append(input, label);
    container.appendChild(wrapper);
  }
}

function show_student_details(rollno) {
  const branch = parseInt(rollno.substring(6, 8));
  const student = students[branch][rollno];
  const tbody = document.getElementById("student-info");

  document.getElementById("student-information").style.display = "block";
  document.getElementById("student-marks").style.display = "block";

  tbody.innerHTML = `<tr><td>${rollno}${(gold_medal.includes(rollno)?"🥇":"")}</td><td>${student.name}</td></tr>`;
}

function show_sem_selections(rollno) {
  const start = rollno.startsWith("22") ? 3 : 1;
  const select = document.getElementById("year-sem");
  select.innerHTML = '';

  for (let i = start; i <= sem_number; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = sem_numbering(`semester${i}`);
    if (i === sem_number) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener("change", e => display_results(parseInt(e.target.value)));
}

function display_results(sem) {
  const rollno = document.getElementById("rollno").value.trim();
  const branch = parseInt(rollno.substring(6, 8));
  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = '';

  for (let obj in marks[branch][sem][rollno]) {
    const tr = document.createElement("tr");
    const sub = subjects[obj];
    tr.innerHTML = `
      <td class="d-none d-lg-table-cell d-md-table-cell">${sub.name[0]}</td>
      <td class="d-lg-none d-md-none">${sub.name[1]}</td>
      ${marks[branch][sem][rollno][obj].map((v, i) =>
        `<td>${i === 3 ? `${v}[${grades[v]}]` : v}</td>`
      ).join("")}
    `;
    tbody.appendChild(tr);
  }

  document.getElementById("sgpa").textContent =
    students[branch][rollno][`semester${sem}`].toFixed(2);
}

function get_marks(rollno) {
  const branch = parseInt(rollno.substring(6, 8));
  const fsem = [];

  for (let i = 1; i <= sem_number; i++) {
    if (students[branch][rollno][`semester${i}`] === 0) {
      fsem.push(i);
    }
  }

  const scodes = [];
  fsem.forEach(sem => {
    for (let obj in marks[branch][sem][rollno]) {
      if (marks[branch][sem][rollno][obj][3] === 0) {
        scodes.push([sem_numbering(`semester${sem}`),obj]);
      }
    }
  });

  const cont = document.getElementById('estimate-container');
  cont.innerHTML = '';

  scodes.forEach(([sn,scode]) => {
    const row = document.createElement("div");
    row.className = "row mb-2 align-items-center";

    const labelCol = document.createElement("div");
    labelCol.className = "col-md-4 col-sm-12 mb-1";
    const label = document.createElement("label");
    label.setAttribute("for", scode);
    label.className = "form-label fw-bold";

    const fullName = document.createElement("span");
    fullName.className = "d-none d-md-inline";
    fullName.textContent = `[ ${sn} ] `+ subjects[scode]["name"][0];

    const shortName = document.createElement("span");
    shortName.className = "d-inline d-md-none";
    shortName.textContent = `[ ${sn} ] `+ subjects[scode]["name"][1];

    label.append(fullName, shortName);
    labelCol.appendChild(label);

    const selectCol = document.createElement("div");
    selectCol.className = "col-md-8 col-sm-12";
    const select = document.createElement("select");
    select.className = "form-select";
    select.id = scode;

    [0, 5, 6, 7, 8, 9, 10].forEach(val => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = `${val}    [${grades[val]}]`;
      select.appendChild(option);
    });

    selectCol.appendChild(select);
    row.append(labelCol, selectCol);
    cont.appendChild(row);
  });
}

function estimate_marks(event) {
  const rollno = document.getElementById("rollno").value.trim();
  if (event.target.checked) {
    document.getElementById("score").style.display = "none";
    document.getElementById("estimate-score").style.display = "block";
    get_marks(rollno);
  } else {
    document.getElementById("score").style.display = "block";
    document.getElementById("estimate-score").style.display = "none";
    show(rollno);
  }
}

function calculate() {
  const results = {};
  document.querySelectorAll("#estimate-container select").forEach(select => {
    results[select.id] = parseInt(select.value);
  });

  const rollno = document.getElementById("rollno").value.trim();
  const branch = parseInt(rollno.substring(6, 8));
  const sgpas = [];
  let semstart;
  let le=false;
  if(rollno.startsWith("22")){
    semstart=3;
    le=true;
  }else{
    semstart=1;
    le=false;
  }
  let sem_colors=[]
  for (let sem = semstart; sem <= sem_number; sem++) {
    const semKey = `semester${sem}`;
    if (students[branch][rollno][semKey] !== 0) {
      sgpas.push(students[branch][rollno][semKey]);
      sem_colors.push(false);
    } else {
      let sgpa = 0;
      let valid = true;
      for (let scode in marks[branch][sem][rollno]) {
        const mark = marks[branch][sem][rollno][scode][3];
        const credit = subjects[scode]["credits"];
        const est = results[scode];

        if (mark !== 0) {
          sgpa += mark * credit;
        } else if (est !== 0) {
          sgpa += est * credit;
        } else {
          valid = false;
          break;
        }
      }
      sgpas.push(valid ? parseFloat((sgpa / tc[branch][sem]).toFixed(2)) : 0);
      sem_colors.push(true);
    }
  }
  const tbody = document.getElementById('estimated-sgpa-score');
  const thead = document.getElementById("estimate-table-head");
  tbody.innerHTML = '';
  thead.innerHTML = '';
  document.getElementById("estimate-table").style.display = 'table';

  thead.innerHTML = `<tr><th>Semester</th><th>SGPA</th></tr>`;
  const labels = [];
  
  sgpas.forEach((sgpa, idx) => {
    const tr = document.createElement("tr");
    const label = sem_numbering(`semester${idx + 1+(le?2:0)}`);
    labels.push(label);
    tr.innerHTML = `<td style='color:${sem_colors[idx]?"#ffc107 !important":""}'>${label}</td><td>${sgpa.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });

  let total=0;
  let is_le=(rollno.startsWith("22")?true:false);
  if(sgpas.includes(0)){
    total=0;
  }else{
    let end=is_le?2:0;
    for(let i=0;i<sem_number-end;i++){
      total+=sgpas[i]*tc[branch][i+1+end];
    }
  }
  
  const cgpa = rollno.startsWith("22")
    ? (total / 123).toFixed(2)
    : (total / 160).toFixed(2);
  


  document.getElementById("cgpa").textContent = cgpa;
  per=cgpa>0?((cgpa-0.5)*10).toFixed(2)+" %":"0 %";
  document.getElementById("percentage").textContent = per;
  document.getElementById('class-awarded').textContent=class_awarded(cgpa);
  tbody.innerHTML += `<tr><td style='color:#ffc107 !important'>CGPA</td><td>${cgpa}</td>`;
  tbody.innerHTML += `<tr><td style='color:#ffc107 !important'>PER %</td><td>${per}</td>`;
  show_linechart(sgpas, labels);
}

// ANALYTICS SECTION

function sliderChanged(e) {
  const value = e.target.value;
  document.getElementById("jntuh-marks").style.display = value === "0" ? "block" : "none";
  document.getElementById("analytics").style.display = value === "100" ? "block" : "none";
  document.getElementById("creator").style.display= value==="50"?"block":'none';
  if (value === "100") {
    display_branch_select();
    display_year_sem_select();
    display_scores();
  }
}

function adjustCheckbox(){
  const checkbox=document.getElementById("sgss");
  if(window.innerWidth>=768){
    checkbox.checked=true;
    checkbox.disabled=true;
  }else{
    if(!checkbox.checked){
      checkbox.checked=false;
      checkbox.disabled=false;
    }
  }
  check_adjustCheckBox();
}

function check_adjustCheckBox(){
  const checkbox=document.getElementById("sgss");
  if(checkbox.checked){
    document.getElementById("block-2").style.display="block"
    document.getElementById("mixedgraph-block").style.display='block';
    show_subject_list_sem_wise(document.getElementById('select-branch').value,document.getElementById("select-year-sem").value);
    select_subject();
  }else{
    document.getElementById("block-2").style.display="none";
    document.getElementById("mixedgraph-block").style.display='none';
    document.getElementById("gpa-scores").style.display="block";
    document.getElementById("sub-scores").style.display="none";
  }
}
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.addEventListener('load',adjustCheckbox);
window.addEventListener('resize', debounce(() => {

  if (linegraph) linegraph.resize();
  if (piegraph) piegraph.resize();
  if (bargraph) bargraph.resize();
  if (mixedgraph) mixedgraph.resize();

}, 250));



function display_branch_select() {
  const select = document.getElementById("select-branch");
  select.innerHTML = `<option value="0">All Branches</option>`;
  for (let branch in branches) {
    const opt = document.createElement("option");
    opt.value = branch;
    opt.textContent = branches[branch][1];
    select.appendChild(opt);
  }
  document.getElementById('section-container').style.display='none';
}

function display_year_sem_select() {
  const select = document.getElementById("select-year-sem");
  select.innerHTML = `<option value="0">All Semesters</option>`;
  for (let i = 1; i <= sem_number; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = sem_numbering(`semester${i}`);
    select.appendChild(opt);
  }
}

function select_branch_value(e) {
  const bcode = e.target.value;
  const sectionContainer = document.getElementById('section-container');
  if (bcode == 0) {
    sectionContainer.style.display = 'none';
  } else {
    sectionContainer.style.display = 'block';
    display_section_Checkboxes(bcode);
  }
  if(document.getElementById("sgss").checked){
    show_subject_list_sem_wise(bcode,document.getElementById("select-year-sem").value);
  }
  display_scores();
  
}

const section_branches = {
  1: ["A"], 3: ["A"], 4: ["A", "B"],
  5: ["A", "B", "C", "D"], 66: ["A", "B"], 67: ["A", "B"]
};

function display_section_Checkboxes(branch) {
  const container = document.getElementById('section-checkboxes');
  container.innerHTML = '';
  section_branches[branch].forEach(sec => {
    const div = document.createElement('span');
    div.className = 'form-check form-check-inline me-3';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input';
    checkbox.id = `checkbox-${sec}`;
    checkbox.value = sec;
    checkbox.checked = true;
    checkbox.addEventListener('change', sec_checkbox_logic);

    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor = sec;
    label.textContent = sec;

    div.append(checkbox, label);
    container.appendChild(div);
  });
}

function sec_checkbox_logic() {
  const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
  let sections = [];
  boxes.forEach(box => { if (box.checked) sections.push(box.value); });
  if (!sections.length) boxes.forEach(box => { box.checked = true; sections.push(box.value); });
  helper();
}
function helper(){
  let val=0;
  if(document.getElementById("sgss").checked){
    val=document.getElementById("subjects-list-sem-wise").value;
  }
  
  if(val==0){
    display_scores();
  }else{
    select_subject();
  }
}
function display_scores() {
  const branch = document.getElementById("select-branch").value;
  const semcode = document.getElementById("select-year-sem").value;
  let subcode=0;
  if(document.getElementById("sgss").checked){
    show_subject_list_sem_wise(branch,semcode);
    subcode=document.getElementById("subjects-list-sem-wise").value;
  }
  if(subcode==0){
    document.getElementById("gpa-scores").style.display="block";
    document.getElementById("sub-scores").style.display="none";
    collectStudents(branch, semcode);
  }else{
    document.getElementById("gpa-scores").style.display="none";
    document.getElementById("sub-scores").style.display="block";
    select_subject();
  }
  
}

function collectStudents(bcode, semcode) {
  let scores = [];
  let semKey;
  if(semcode!=0){
    semKey = `semester${semcode}`;
  }else{
    semKey = `cgpa`;
  }
  if (bcode == 0 && semcode == 0) {
    document.getElementById("openModalBtnA").disabled=true;
    for (const branch in students) {
      for (const rollno in students[branch]) {
        scores.push({ rollno, cgpa: students[branch][rollno].cgpa });
      }
    }
    document.getElementById('text-name').textContent="CGPA";
  } else if (bcode != 0 && semcode == 0) {
    document.getElementById("openModalBtnA").disabled=true;
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for (const rollno in students[bcode]) {
     if (sections.includes(students[bcode][rollno]["section"])) {
        scores.push({ rollno, cgpa: students[bcode][rollno][semKey] });
      }
    }
    document.getElementById('text-name').textContent="CGPA";
  } else if (bcode == 0 && semcode != 0) {
    document.getElementById("openModalBtnA").disabled=true;
    for (const branch in students) {
      for (const rollno in students[branch]) {
        if((rollno.startsWith('22'))&&(semcode==1 || semcode==2)) continue;
        scores.push({ rollno, cgpa: students[branch][rollno][semKey] });
      }
    }
    document.getElementById('text-name').textContent="SGPA";
  } else {
    document.getElementById("openModalBtnA").disabled=false;
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for (const rollno in students[bcode]) {
      if((rollno.startsWith('22'))&&(semcode==1 || semcode==2)) continue;
      if (sections.includes(students[bcode][rollno]["section"])) {
        scores.push({ rollno, cgpa: students[bcode][rollno][semKey] });
      }
    }
    document.getElementById('text-name').textContent="SGPA";
  }
  if(document.getElementById("sgss").checked){
    show_subject_list_sem_wise(bcode,semcode);
    count_pf(bcode,semcode)
    barchart(bcode,semcode)
  }
  renderTable(scores);
}

function renderTable(scores) {
  const tbody = document.getElementById("score-body");
  document.getElementById('search-rollno').value = '';

  scores.sort((a, b) => b.cgpa - a.cgpa);

  const fragment = document.createDocumentFragment();

  scores.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${student.rollno}${(gold_medal.includes(student.rollno))?'🥇':''}</td><td>${student.cgpa.toFixed(2)}</td>`;
    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

function search_rollno(e) {
  const rollno = e.target.value.trim().toUpperCase();
  document.querySelectorAll("#display-table tbody tr").forEach(row => {
    row.style.display = row.textContent.toUpperCase().includes(rollno) ? '' : 'none';
  });
}

function show_subject_list_sem_wise(branch,sem){
  let select=document.getElementById("subjects-list-sem-wise");
  select.innerHTML = `<option value="0">All Subjects</option>`;
  if(branch!=0 && sem!=0){
    branch_sem_sub[branch][sem].map(scode=>{
      const opt = document.createElement("option");
      opt.value = scode;
      opt.textContent = subjects[scode]['name'][1];
      select.appendChild(opt);
    })
  }
}


function count_pf(bcode,semcode){
  let p=0,f=0;
  if(bcode==0 && semcode==0){
    for(let branch in students){
      for(let student in students[branch]){
        if(students[branch][student].cgpa!=0){
        p++;
        }else{
          f++;
        }
      }
    }
  }
  else if(bcode!=0 && semcode==0){
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for(let student in students[bcode]){
      if(sections.includes(students[bcode][student]["section"])){
        if(students[bcode][student].cgpa!=0){
        p++;
        }else{
          f++;
        }
      }
    }  
  }
  else if(bcode==0 && semcode!=0){
    for(let branch in students){
      for(let student in students[branch]){
        if((semcode==1 || semcode==2) && student.startsWith("22")) continue;
        if(students[branch][student][`semester${semcode}`]!=0){
          p++;
        }else{
          f++;
        }
      }
    }
  }else{
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for(let student in students[bcode]){
      if((semcode==1 || semcode==2) && student.startsWith("22")) continue;
      if(sections.includes(students[bcode][student]["section"])){
        if(students[bcode][student][`semester${semcode}`]!=0){
        p++;
        }else{
          f++;
        }
      }
    }
  }
  show_piechart(p,f);
}


function barchart(bcode,sem){
  let d1=[],d2=[],labels=[],d11=[],d22=[];
  if(bcode==0 && sem==0){
    for(let branch in students){
      let p=0,f=0;
      for(let rollno in students[branch]){
        if(students[branch][rollno]["cgpa"]!=0){
          p++;
        }else{
          f++;
        }
      }
      d1.push(p);
      d2.push(f);
      d11.push(((p/(p+f))*100).toFixed(2))
      d22.push(((f/(p+f))*100).toFixed(2));
      labels.push(branches[branch][1]);
      
    }
    show_mixedgraph(d11,d22,labels);
    show_barchart_all_branch_cgpa(d1,d2,labels)
  }else if(bcode!=0 && sem==0){
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for(let i=1;i<=sem_number;i++){
      let p=0,f=0;
      for(let rollno in students[bcode]){
        if((i==1 || i==2)&&rollno.startsWith("22")) continue;
        if(sections.includes(students[bcode][rollno]["section"])){
          if(students[bcode][rollno][`semester${i}`]!=0){
          p++;
          }else{
            f++;
          }
        }
      }
      d1.push(p);
      d2.push(f);
      d11.push(((p/(p+f))*100).toFixed(2))
      d22.push(((f/(p+f))*100).toFixed(2));
      labels.push(sem_numbering(`semester${i}`));
      
    }
    show_mixedgraph(d11,d22,labels);
    show_barchart_all_branch_cgpa(d1,d2,labels)
  }else if(bcode==0 && sem!=0){
    for(let branch in students){
      let p=0,f=0;
      for(let rollno in students[branch]){
        if((sem==1 || sem==2) && rollno.startsWith("22")) continue;
        if(students[branch][rollno][`semester${sem}`]!=0){
          p++;
        }else{
          f++;
        }
      }
      d1.push(p);
      d2.push(f);
      d11.push(((p/(p+f))*100).toFixed(2))
      d22.push(((f/(p+f))*100).toFixed(2));
      labels.push(branches[branch][1]);
      
    }
    show_barchart_all_branch_cgpa(d1,d2,labels);
    show_mixedgraph(d11,d22,labels);
  }else{
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);

    branch_sem_sub[bcode][sem].map(bsc=>{
      let p=0,f=0;
      for(let rollno in students[bcode]){
        
        if(sections.includes(students[bcode][rollno]['section'])){
          if((sem==1 || sem==2) && rollno.startsWith("22")) continue;
          if(bsc in marks[bcode][sem][rollno]){
            if(marks[bcode][sem][rollno][bsc][3]!=0){
            p++;
            }else{
              f++;
            }
          }
        }
      }
      d1.push(p);
      d2.push(f);
      d11.push(((p/(p+f))*100).toFixed(2))
      d22.push(((f/(p+f))*100).toFixed(2));
      labels.push(subjects[bsc]["name"][1]);
    });
    show_barchart_all_branch_cgpa(d1,d2,labels);
    show_mixedgraph(d11,d22,labels);
  }
}


function show_barchart_all_branch_cgpa(d1,d2,labels){
  if(bargraph) bargraph.destroy();
  bargraph = new Chart(document.getElementById("bargraph"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total pass',
        data: d1,
        backgroundColor: '#FF6384', 
        borderColor: '#FF6384',
        borderWidth: 1
      }, 
      {
        label: 'Total Fail',
        data: d2,
        backgroundColor: '#36A2EB', 
        borderColor: '#36A2EB',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          
          ticks: {
            color: '#FFFFFF',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          beginAtZero: true,
          min: 0,
          max: Math.max(...d1, ...d2) + 15,
          ticks: {
            stepSize: 50,
            color: '#FFFFFF',
            font: {
              weight: 'bold'
            }
          },
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#FFFFFF',
            font: {
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.dataset.label + ': ' + tooltipItem.raw;
            }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#FFFFFF',
          font: {
            weight: 'bold',
            size: 10
          },
          formatter: function (value) {
            return value;
          }
        }
      },
      barPercentage: 0.8,
      categoryPercentage: 0.8
    },
    plugins: [ChartDataLabels]
  });

}


function show_mixedgraph(d1,d2,labels){
  if(mixedgraph) mixedgraph.destroy();
  mixedgraph = new Chart(document.getElementById("mixedgraph"), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total pass %',
        data: d1,
        backgroundColor: '#FF6384', 
        borderColor: '#FF6384',
        borderWidth: 1
      }, 
      {
        label: 'Total Fail %',
        data: d2,
        backgroundColor: '#36A2EB', 
        borderColor: '#36A2EB',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          
          ticks: {
            color: '#FFFFFF',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          beginAtZero: true,
          min: 0,
          max: Math.max(...d1, ...d2) + 15,
          ticks: {
            stepSize: 25,
            color: '#FFFFFF',
            font: {
              weight: 'bold'
            }
          },
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#FFFFFF',
            font: {
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.dataset.label + ': ' + tooltipItem.raw;
            }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#FFFFFF',
          font: {
            weight: 'bold',
            size: 10
          },
          formatter: function (value) {
            return value;
          }
        }
      },
      barPercentage: 0.8,
      categoryPercentage: 0.8
    },
    plugins: [ChartDataLabels]
  });

}




function show_piechart(x, y) {
  if (piegraph) {
    piegraph.destroy();
  }
  piegraph = new Chart(document.getElementById('piegraph').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Pass', 'Fail'],
      datasets: [
        {
          label: "pie chart",
          data: [x, y],
          backgroundColor: ['#FF6384', '#36A2EB'],
          borderColor: ['#FF6384', '#36A2EB'],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'white',
            font: {
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.label + ': ' + tooltipItem.raw;
            }
          }
        },
        datalabels: {
          formatter: function (value, context) {
            var total = context.dataset.data.reduce((a, b) => a + b, 0);
            var percentage = (value / total) * 100;
            return percentage.toFixed(2) + '%';
          },
          color: '#FFFFFF',
          font: {
            weight: 'bold'
          },
          anchor: 'center',
          align: 'center'
        }
      },
      cutout: '60%',
    },
    plugins: [ChartDataLabels]
  });
}


function select_subject(){
  select=document.getElementById("subjects-list-sem-wise");
  subject=select.value;
  branch=document.getElementById("select-branch").value;
  sem=document.getElementById("select-year-sem").value
  count_pf(branch,sem)
  barchart(branch,sem)
  if(subject!=0){
    document.getElementById("gpa-scores").style.display="none";
    document.getElementById("sub-scores").style.display="block";
    let d=[];
    let [co,caa,ca,cbb,cb,cc,cf]=[0,0,0,0,0,0,0];
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for(let rollno in students[branch]){
      if((sem==1 || sem==2) && rollno.startsWith('22')) continue;
      if(!sections.includes(students[branch][rollno]["section"])) continue;
      if(!(subject in marks[branch][sem][rollno])) continue;
      if(marks[branch][sem][rollno][subject][3]==10){
        co++;
      }
      else if(marks[branch][sem][rollno][subject][3]==9){
        caa++;
      }
      else if(marks[branch][sem][rollno][subject][3]==8){
        ca++;
      }
      else if(marks[branch][sem][rollno][subject][3]==7){
        cbb++;
      }
      else if(marks[branch][sem][rollno][subject][3]==6){
        cb++;
      }
      else if(marks[branch][sem][rollno][subject][3]==5){
        cc++;
      }
      else if(marks[branch][sem][rollno][subject][3]==0){
        cf++;
      }
    }
    d.push(co);
    d.push(caa);
    d.push(ca);
    d.push(cbb);
    d.push(cb);
    d.push(cc);
    d.push(cf);
    show_barchart_sub(d);
    sub_grade_change()
    show_piechart(co+caa+ca+cbb+cb+cc,cf);
  }else{
    document.getElementById("gpa-scores").style.display="block";
    document.getElementById("sub-scores").style.display="none";
  }
  
}

function sub_grade_change(){
  const select = document.getElementById("select-grade");
  show_subjects_table(document.getElementById("subjects-list-sem-wise").value,select.value);
}
function show_subjects_table(subcode,grade){
  let tbody=document.getElementById("score-body-subject");
  branch=document.getElementById("select-branch").value;
  sem=document.getElementById("select-year-sem").value;
  const fragment = document.createDocumentFragment();
  const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
  const sections = [...boxes].filter(b => b.checked).map(b => b.value);
  let is_there=false;
  for(let rollno in students[branch]){
    if((sem==1 || sem==2) && rollno.startsWith("22")) continue;
    if(!sections.includes(students[branch][rollno]['section'])) continue;
    if(!(subject in marks[branch][sem][rollno])) continue;
    if(marks[branch][sem][rollno][subcode][3]==grade){
      is_there=true;
      let tr=document.createElement("tr");
      tr.innerHTML=`<tr><td>${rollno}${(gold_medal.includes(rollno))?'🥇':''}</td><td>${marks[branch][sem][rollno][subcode][2]}</td></tr>`
      fragment.appendChild(tr);
    }
  }
  if(is_there){
    document.getElementById('display-table-subject').style.display="block";
    document.getElementById("no-records").style.display="none";
    tbody.innerHTML='';
    tbody.appendChild(fragment);
  }else{
    document.getElementById('display-table-subject').style.display="none";
    document.getElementById("no-records").style.display="block";
  }

}

function show_barchart_sub(d){
  if(bargraph) bargraph.destroy();
  bargraph = new Chart(document.getElementById("bargraph"), {
    type: 'bar',
    data: {
      labels: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'],
      datasets: [{
        label: "grades",
        data: d,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF5733', '#66FF66', '#FF9999', '#4D4DFF'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF5733', '#66FF66', '#FF9999', '#4D4DFF'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'white',
            font: {
              weight: 'bold'
            }
          }
        },
        x: {
          ticks: {
            color: 'white',
            font: {
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'white',
            font: {
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              return tooltipItem.label + ': ' + tooltipItem.raw;
            }
          },
          titleColor: 'white',
          bodyColor: 'white',
          titleFont: {
            weight: 'bold'
          },
          bodyFont: {
            weight: 'bold'
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: 'white',
          font: {
            weight: 'bold',
            size: 10
          },
          formatter: function (value) {
            return value;
          }
        }
      },
      barPercentage: 0.8,
      categoryPercentage: 0.8
    },
    plugins: [ChartDataLabels]
  });
}


function modalchanged(){
  const table = document.getElementById('modal-table');
  table.querySelectorAll("tbody").forEach(tbody=>tbody.remove());
  const tbody = document.createElement("tbody");
  rollno=document.getElementById("rollno").value.trim();
  branch=parseInt(rollno.substring(6,8));
  sem=document.getElementById("year-sem").value;
  for(let subcode in marks[branch][sem][rollno]){
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    td1.textContent = subjects[subcode]['name'][1];
    td2.textContent = subjects[subcode]['name'][0];
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const modal = new bootstrap.Modal(document.getElementById('tableModal'));
  modal.show();
}


function modalchangedA(){
  const table = document.getElementById('modal-table');
  table.querySelectorAll("tbody").forEach(tbody=>tbody.remove());
  const tbody = document.createElement("tbody");
  branch=document.getElementById("select-branch").value;
  sem=document.getElementById("select-year-sem").value;
  branch_sem_sub[branch][sem].map(subcode=>{
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    td1.textContent = subjects[subcode]['name'][1];
    td2.textContent = subjects[subcode]['name'][0];
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  const modal = new bootstrap.Modal(document.getElementById('tableModal'));
  modal.show();
}



function modalchangedB(){
  const table = document.getElementById('modal-table');
  table.querySelectorAll("tbody").forEach(tbody=>tbody.remove());
  rollno=document.getElementById("rollno").value.trim();
  branch=parseInt(rollno.substring(6,8));
  for(let sem=1;sem<=sem_number;sem++){
    let tbody=document.createElement("tbody");
    let flag=true;
    for(let subcode in marks[branch][sem][rollno]){
      if(marks[branch][sem][rollno][subcode][3]==0){
        if(flag){
          let tr=document.createElement("tr");
          let td=document.createElement("td");
          td.textContent=sem_numbering(`semester${sem}`)
          td.colSpan=3;
          td.className="text-center";
          tr.appendChild(td);
          tbody.appendChild(tr);
          flag=false;  
        }
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        const td2 = document.createElement('td');
        td1.textContent = subjects[subcode]['name'][1];
        td2.textContent = subjects[subcode]['name'][0];
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
      }
    }
    if(!flag){
      table.appendChild(tbody);
    }
  }
  const modal = new bootstrap.Modal(document.getElementById('tableModal'));
  modal.show();
}