document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants HTML with delete icon
        let participantsHtml;
        if (details.participants.length) {
          participantsHtml = `
            <p><strong>Participants:</strong></p>
            <ul class="participants-list" style="list-style-type: none; padding-left: 0;">
              ${details.participants.map(email => `
                <li style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="flex-grow:1;">${email}</span>
                  <button class="delete-participant-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" title="Unregister participant" aria-label="Delete participant" style="background: none; border: none; cursor: pointer; margin-left: 8px; font-size: 1.1em; color: #c62828;">
                    &#128465;
                  </button>
                </li>
              `).join("")}
            </ul>
          `;
        } else {
          participantsHtml = `<p><em>No participants yet.</em></p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-participant-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
          e.preventDefault();
          const activity = decodeURIComponent(this.getAttribute('data-activity'));
          const email = decodeURIComponent(this.getAttribute('data-email'));
          const li = this.closest('li');
          // Remove participant from UI immediately
          if (li) li.remove();
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message || 'Participant unregistered.';
              messageDiv.className = 'success';
              // Optionally refresh activities to update spots left, etc.
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'Failed to unregister participant.';
              messageDiv.className = 'error';
              // Optionally restore participant if API failed
              // fetchActivities();
            }
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
          } catch (error) {
            messageDiv.textContent = 'Error unregistering participant.';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            // Optionally restore participant if API failed
            // fetchActivities();
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities so participants list updates
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
