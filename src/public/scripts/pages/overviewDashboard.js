const companyId = sessionStorage.getItem('company_id');
fetch(`/Dashboard/sustainability-goals/${companyId}`)
    .then(response => response.json())
    .then(data => {
        if (data) {
            const goalsList = document.getElementById('sustainability-goals-list');
            data.forEach(goal => {
                const li = document.createElement('li');
                li.textContent = `${goal.goal_name} - Target: ${goal.target_value}`;
                goalsList.appendChild(li);
                // console.log(goal);
            });
        } else {
            alert("No sustainability goals data found.");
        }
    })
    .catch(error => console.error("Error fetching sustainability goals data:", error));

