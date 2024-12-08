const express = require('express');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const reader = require('xlsx');
const app = express();
const port = 3001;

app.use(cors());



const spreadsheetId = '1Kyg8UBIXbkgIYwYmzYmPe3OtxkTZ02jQBHsDlhdmz7U';
const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;


// GraphQL query to fetch user stats (problem count by difficulty)
const userStatsQuery = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
  }
`;

// GraphQL query to fetch recent submissions
const recentSubQuery = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      timestamp
      statusDisplay
      runtime
      memory
      lang
    }
  }
`;



async function refreshStudentsData(){
  // Fetch the Google Sheets file
  axios.get(url, { responseType: 'arraybuffer' })
  .then(response => {
    // Convert response data into buffer
    const dataBuffer = Buffer.from(response.data);
    // Parse the Excel file
    const file = reader.read(dataBuffer);
    let data = [];
    const sheets = file.SheetNames;
    for (let i = 0; i < sheets.length; i++) {
      const temp = reader.utils.sheet_to_json(file.Sheets[sheets[i]]);
      temp.forEach(res => {
        data.push(res);
      });
    }
    // Print data

    let sName =``;
    let sUrl = ``;
    let sRoll = ``;
    let sSection = ``;
    data.forEach((val)=>{
      sName+=(val.name+'\n');
      sRoll+=(val.roll+'\n');
      sUrl+=(val.url+'\n');
      sSection+=(val.section+'\n');
    })

    fs.writeFile('roll.txt', sRoll, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Text written to file successfully');
      }
    });

    fs.writeFile('name.txt', sName, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Text written to file successfully');
      }
    });

    fs.writeFile('sections.txt', sSection, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Text written to file successfully');
      }
    });

    fs.writeFile('urls.txt', sUrl, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('Text written to file successfully');
      }
    });


  })
  .catch(error => {
    console.error('Error fetching the file:', error);
  });

}
async function fetchLeet(username) {
  const graphqlUrl = "https://leetcode.com/graphql";
  
  try {
    // Fetch user statistics (problem count by difficulty)
    const statsResponse = await axios.post(graphqlUrl, {
      query: userStatsQuery,
      variables: { username },
    });

    // Fetch recent submissions
    const recentSubResponse = await axios.post(graphqlUrl, {
      query: recentSubQuery,
      variables: { username, limit: 5 },
    });

    const userStats = statsResponse.data.data.matchedUser.submitStats.acSubmissionNum || [];
    const recentSubmissions = recentSubResponse.data.data.recentAcSubmissionList || [];

    // Process user stats to get counts by difficulty
    const stats = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      isCorrect:true,
    };

    userStats.forEach(item => {
      switch (item.difficulty) {
        case "All":
          stats.totalSolved = item.count;
          break;
        case "Easy":
          stats.easySolved = item.count;
          break;
        case "Medium":
          stats.mediumSolved = item.count;
          break;
        case "Hard":
          stats.hardSolved = item.count;
          break;
        default:
          break;
      }
    });

    return {
      stats,
      recentSubmissions,
    };
  } catch (error) {
    console.error(`Error fetching data for ${username}:`, error);
    return {
      stats: {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        isCorrect: false,
      },
      recentSubmissions: [],
    };
  }
}

async function fetchAndSaveData() {
  try {
    console.log('Starting to read input files...');
    const rolls = fs.readFileSync('roll.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const names = fs.readFileSync('name.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    const sections = fs.readFileSync('sections.txt', 'utf-8').split('\n').map(line => line.trim()).filter(Boolean);
    
    if (rolls.length !== names.length || names.length !== urls.length || names.length !== sections.length) {
      console.error('Error: The number of rolls, names, URLs, and sections do not match.');
      return;
    }

    console.log('Input files read successfully.');
    const combinedData = [];

    
    for (let i = 0; i < rolls.length; i++) {


      const roll = rolls[i];
      const name = names[i];
      const url = urls[i];
      const section = sections[i];
      let studentData = { roll, name, url, section };

      console.log(`Processing data for roll number: ${roll}, name: ${name}, section: ${section}`);

      
      if (url.startsWith('https://leetcode.com/u/')) {
        var username = url.split('/u/')[1];
        if (username.charAt(username.length - 1) == '/') username = username.substring(0, username.length - 1);
        console.log(`Fetching data for LeetCode username: ${username}`);

        try {
          const { stats, recentSubmissions } = await fetchLeet(username);
          if(!stats.isCorrect){
            studentData.info = 'No LeetCode data available';
          }else{
            studentData = {
              ...studentData,
              username,
              totalSolved: stats.totalSolved,
              easySolved: stats.easySolved,
              mediumSolved: stats.mediumSolved,
              hardSolved: stats.hardSolved,
              recentSubmissions,
            };
            console.log(`Data for ${username} fetched and processed successfully.`);
          }
          
        } catch (error) {
          console.error(`Error fetching data for ${username}:`, error);
        }
      } else {
        console.log(`URL for ${name} is not a LeetCode profile. Skipping API call.`);
        studentData.info = 'No LeetCode data available';
      }

      combinedData.push(studentData);
    }
    

    combinedData.sort((a, b) => {
      const aTotalSolved = isNaN(a.totalSolved) ? 0 : a.totalSolved;
      const bTotalSolved = isNaN(b.totalSolved) ? 0 : b.totalSolved;
      return bTotalSolved - aTotalSolved;
    });

    fs.writeFileSync('data.json', JSON.stringify(combinedData, null, 2));
    console.log('Data saved to data.json successfully.');
  } catch (error) {
    console.error('Error processing data:', error);
  }
}

app.get('/data', (req, res) => {
  res.sendFile(__dirname + '/data.json');
});

// Initial data fetch and periodic refresh every hour


refreshStudentsData();
fetchAndSaveData();
setInterval(fetchAndSaveData, 60 * 60 * 1000);
setInterval(refreshStudentsData, 30 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


