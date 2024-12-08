
document.addEventListener('DOMContentLoaded', async () => {
    try {
        
             
        const response = await fetch("https://leettrack-leaderboard.onrender.com/data");
        const data = await response.json();
        let filteredData = [...data]; // Keep original data separate
        let yashData = [...data];
        const leaderboardBody = document.getElementById('leaderboard-body');
        const sectionFilter = document.getElementById('section-filter');
        var host =0;
        var day =0;
        yashData.forEach(myFunction);

        function myFunction(item) {
            if(item.dayi==='Day Scholars') host+=1;
            else day+=1;
        }
        console.log(host);
        console.log(day);

        const xValues = ["Hostellers", "Day Scholars",];
        const yValues = [311,307];
        const barColors = [
          "#b91d47",
          "#00aba9",
        ];
        
        // new Chart("myChart", {
        //   type: "pie",
        //   data: {
        //     labels: xValues,
        //     datasets: [{
        //       backgroundColor: barColors,
        //       data: yValues
        //     }]
        //   },
        //   options: {
        //     title: {
        //       display: true,
        //       text: "Hostellers and DaySchollars"
        //     }
        //   }
        // });

        
        // Populate section filter dropdown
        const populateSectionFilter = () => {
            // var sections = [...new Set(data.map(student => student.section || 'N/A'))].sort();
            const sections = ['A','B','C','D'];
            sectionFilter.innerHTML = '<option value="all">All Sections</option>';
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section;
                option.textContent = section;
                sectionFilter.appendChild(option);
            });
        };

        // Function to export data to CSV
        const exportToCSV = (data) => {
            const headers = ['Rank', 'Roll Number','up', 'Name', 'Section', 'Total Solved', 'Easy', 'Medium', 'Hard', 'LeetCode URL','Last question'];
            const csvRows = data.map((student, index) => {
                return [
                    index + 1,
                    student.roll,
                    student.name,
                    student.section || 'N/A',
                    student.totalSolved || 'N/A',
                    student.easySolved || 'N/A',
                    student.mediumSolved || 'N/A',
                    student.hardSolved || 'N/A',
                    student.url
                ].join(',');
            });
            
            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'leaderboard.csv');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        // Function to render the leaderboard
        const renderLeaderboard = (sortedData) => {
            leaderboardBody.innerHTML = '';
            sortedData.forEach((student, index) => {
                const row = document.createElement('tr');
                var diff = student.totalSolved;
                var utcSeconds=0;
                var d;
                if( diff === student.totalSolved) diff =0;
                if(student.recentSubmissions){
                    if(student.recentSubmissions.length > 0){
                    val = student.recentSubmissions[0].title || '';
                     utcSeconds = student.recentSubmissions[0].timestamp || 0;;
                     d = new Date(0); // The 0 there is the key, which sets the date to the epoch
                    d.setUTCSeconds(utcSeconds);
                }else {val = "" }
                }else{
                    val="";
                    utcSeconds = "";
                }
                
                // console.log(student.name + " question " + val ? val : "" + " date " + d ? d : "");
                // console.log(diff);
                row.classList.add('border-b', 'border-gray-700');
                row.innerHTML = `
                    <td class="p-4">${index + 1}</td>
                    <td class="p-4">${student.roll}</td>
                    <td class="p-r">${(diff>0)? " \u2191 " + diff : diff}</td>
                    <td class="p-4">
                        ${(student.url.startsWith('https://leetcode.com/u/') && student.info==null)
                            ? `<a href="${student.url}" target="_blank" class="text-blue-400">${student.name}</a>`
                            : `<div class="text-red-500">${student.name}</div>`}
                    </td>
                    <td class="p-4">${student.section || 'N/A'}</td>
                    <td class="p-4">${student.totalSolved || 'N/A'}</td>
                    <td class="p-4 text-green-400">${student.easySolved || 'N/A'}</td>
                    <td class="p-4 text-yellow-400">${student.mediumSolved || 'N/A'}</td>
                    <td class="p-4 text-red-400">${student.hardSolved || 'N/A'}</td>
                    <td class="p-4">
  <span style="color: red; font-weight: bold;">${val ? val : "Not found"}</span> 
  <span style="color: blue; font-style: italic;">at</span> 
  <br> 
  <span style="color: green; text-decoration: underline;">${d ? d : "Unknown date"}</span>
</td>

                `;
                leaderboardBody.appendChild(row);
            });
        };

        // Filter function
        const filterData = (section) => {
            filteredData = section === 'all' 
                ? [...data]
                : data.filter(student => ((((student.section || 'N/A') === section)) || ((student.dayi || 'N/A') === section)));
            renderLeaderboard(filteredData);
        };

        // Sorting logic with ascending and descending functionality
        let totalSolvedDirection = 'desc';
        let easySolvedDirection = 'desc';
        let mediumSolvedDirection = 'desc';
        let hardSolvedDirection = 'desc';
        let sectionDirection = 'asc';

        const sortData = (data, field, direction, isNumeric = false) => {
            return data.sort((a, b) => {
                const valA = a[field] || (isNumeric ? 0 : 'Z');
                const valB = b[field] || (isNumeric ? 0 : 'Z');
                if (isNumeric) {
                    return direction === 'desc' ? valB - valA : valA - valB;
                } else {
                    return direction === 'desc'
                        ? valB.toString().localeCompare(valA.toString())
                        : valA.toString().localeCompare(valB.toString());
                }
            });
        };

        // Initialize the page
        populateSectionFilter();
        renderLeaderboard(data);

        // Event Listeners
        sectionFilter.addEventListener('change', (e) => {
            filterData(e.target.value);
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            exportToCSV(filteredData); // Export only filtered data
        });

        document.getElementById('sort-section').addEventListener('click', () => {
            sectionDirection = sectionDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'section', sectionDirection, false);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-total').addEventListener('click', () => {
            totalSolvedDirection = totalSolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'totalSolved', totalSolvedDirection, true);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-easy').addEventListener('click', () => {
            easySolvedDirection = easySolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'easySolved', easySolvedDirection, true);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-medium').addEventListener('click', () => {
            mediumSolvedDirection = mediumSolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'mediumSolved', mediumSolvedDirection, true);
            renderLeaderboard(sortedData);
        });

        document.getElementById('sort-hard').addEventListener('click', () => {
            hardSolvedDirection = hardSolvedDirection === 'desc' ? 'asc' : 'desc';
            const sortedData = sortData(filteredData, 'hardSolved', hardSolvedDirection, true);
            renderLeaderboard(sortedData);
        });

    } catch (error) {
        console.error('Error fetching data:', error);
    }
});