
Chart.register(ChartDataLabels);

const grades = { 10: "O", 9: "A+", 8: "A", 7: "B+", 6: "B", 5: "C", 0: "F" };
const sem_number = 7;
let linegraph = null;

const students = JSON.parse(api_key(gstudents));
const marks = JSON.parse(api_key(gmarks));
const subjects = JSON.parse(api_key(gsubjects));
const tc = JSON.parse(api_key(gtc));
const branches = JSON.parse(api_key(gbranches));

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
          formatter: value => value.toFixed(4)
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function set_cgpa(value) {
  const cgpaEl = document.getElementById("cgpa");
  cgpaEl.textContent = value;
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

  tbody.innerHTML = `<tr><td>${rollno}</td><td>${student.name}</td></tr>`;
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
    students[branch][rollno][`semester${sem}`].toFixed(4);
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
        scodes.push(obj);
      }
    }
  });

  const cont = document.getElementById('estimate-container');
  cont.innerHTML = '';

  scodes.forEach(scode => {
    const row = document.createElement("div");
    row.className = "row mb-2 align-items-center";

    const labelCol = document.createElement("div");
    labelCol.className = "col-md-4 col-sm-12 mb-1";
    const label = document.createElement("label");
    label.setAttribute("for", scode);
    label.className = "form-label fw-bold";

    const fullName = document.createElement("span");
    fullName.className = "d-none d-md-inline";
    fullName.textContent = subjects[scode]["name"][0];

    const shortName = document.createElement("span");
    shortName.className = "d-inline d-md-none";
    shortName.textContent = subjects[scode]["name"][1];

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
      option.textContent = val;
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

  for (let sem = 1; sem <= sem_number; sem++) {
    const semKey = `semester${sem}`;
    if (students[branch][rollno][semKey] !== 0) {
      sgpas.push(students[branch][rollno][semKey]);
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
      sgpas.push(valid ? parseFloat((sgpa / tc[branch][sem]).toFixed(4)) : 0);
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
    const label = sem_numbering(`semester${idx + 1}`);
    labels.push(label);

    tr.innerHTML = `<td>${label}</td><td>${sgpa.toFixed(4)}</td>`;
    tbody.appendChild(tr);
  });

  const total = sgpas.includes(0) ? 0 : sgpas.reduce((a, b) => a + b, 0);
  const cgpa = rollno.startsWith("22")
    ? (total / (sem_number - 2)).toFixed(4)
    : (total / sem_number).toFixed(4);

  document.getElementById("cgpa").textContent = cgpa;
  tbody.innerHTML += `<tr><td>CGPA</td><td>${cgpa}</td>`;
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
  }
}

function display_branch_select() {
  const select = document.getElementById("select-branch");
  select.innerHTML = `<option value="0">All Branches</option>`;
  for (let branch in branches) {
    const opt = document.createElement("option");
    opt.value = branch;
    opt.textContent = branches[branch][1];
    select.appendChild(opt);
  }
  display_year_sem_select();
  display_scores();
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
  display_scores();
}

function display_scores() {
  const branch = document.getElementById("select-branch").value;
  const semcode = document.getElementById("select-year-sem").value;
  collectStudents(branch, semcode);
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
    for (const branch in students) {
      for (const rollno in students[branch]) {
        scores.push({ rollno, cgpa: students[branch][rollno].cgpa });
      }
    }
    document.getElementById('text-name').textContent="CGPA";
  } else if (bcode != 0 && semcode == 0) {
    const boxes = document.querySelectorAll("#section-checkboxes input[type='checkbox']");
    const sections = [...boxes].filter(b => b.checked).map(b => b.value);
    for (const rollno in students[bcode]) {
     if (sections.includes(students[bcode][rollno]["section"])) {
        scores.push({ rollno, cgpa: students[bcode][rollno][semKey] });
      }
    }
    document.getElementById('text-name').textContent="CGPA";
  } else if (bcode == 0 && semcode != 0) {
    for (const branch in students) {
      for (const rollno in students[branch]) {
        if((rollno.startsWith('22'))&&(semcode==1 || semcode==2)) continue;
        scores.push({ rollno, cgpa: students[branch][rollno][semKey] });
      }
    }
    document.getElementById('text-name').textContent="SGPA";
  } else {
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
  renderTable(scores);
}

function renderTable(scores) {
  const tbody = document.getElementById("score-body");
  document.getElementById('search-rollno').value = '';

  scores.sort((a, b) => b.cgpa - a.cgpa);

  const fragment = document.createDocumentFragment();

  scores.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${student.rollno}</td><td>${student.cgpa.toFixed(4)}</td>`;
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
