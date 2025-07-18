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
  show_subject_list_sem_wise(bcode,semcode)
  count_pf(bcode,semcode)
  barchart(bcode,semcode)
  renderTable(scores);
}

function renderTable(scores) {
  const tbody = document.getElementById("score-body");
  document.getElementById('search-rollno').value = '';

  scores.sort((a, b) => b.cgpa - a.cgpa);

  const fragment = document.createDocumentFragment();

  scores.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${student.rollno}${(gold_medal.includes(student.rollno))?'🥇':''}</td><td>${student.cgpa.toFixed(4)}</td>`;
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

function count_bar_pf(){
  
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
      show_mixedgraph(d11,d22,labels);
    }
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
      show_mixedgraph(d11,d22,labels);
    }
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
      show_mixedgraph(d11,d22,labels);
    }
    show_barchart_all_branch_cgpa(d1,d2,labels);
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


function piechart(){

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
  }else{
    document.getElementById("gpa-scores").style.display="block";
    document.getElementById("sub-scores").style.display="none";
    barchart(branch,sem);
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
  for(let rollno in students[branch]){
    if((sem==1 || sem==2) && rollno.startsWith("22")) continue;
    if(!sections.includes(students[branch][rollno]['section'])) continue;
    if(marks[branch][sem][rollno][subcode][3]==grade){
      let tr=document.createElement("tr");
      tr.innerHTML=`<tr><td>${rollno}${(gold_medal.includes(rollno))?'🥇':''}</td><td>${marks[branch][sem][rollno][subcode][2]}</td></tr>`
      fragment.appendChild(tr);
    }
  }
  tbody.innerHTML='';
  tbody.appendChild(fragment);

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
          beginAtZero: true
          }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
                return tooltipItem.label + ': ' + tooltipItem.raw;
                }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#fff',
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