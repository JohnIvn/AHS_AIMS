<style>
    .pr-request-form {
        font-family: 'Times New Roman', serif;
        max-width: 800px;
        margin: 20px auto;
        padding: 30px;
        border: 1px solid #ccc;
        line-height: 1.6;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .pr-request-form p {
        margin: 0 0 15px 0;
    }
    .pr-request-form label {
        display: block;
        margin-top: 15px;
        font-weight: bold;
        color: #333;
    }
    .pr-request-form input[type="text"],
    .pr-request-form input[type="datetime-local"] {
        width: 100%;
        padding: 10px;
        margin-top: 5px;
        box-sizing: border-box;
        border: 1px solid #999;
        border-radius: 4px;
        font-size: 14px;
    }
    .pr-request-form input[type="datetime-local"] {
        max-width: 250px;
    }
    .pr-request-form table {
        width: 100%;
        border-collapse: collapse;
        margin: 25px 0;
        border: 2px solid #333;
    }
    .pr-request-form th {
        background-color: #2f3b6c;
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #444;
    }
    .pr-request-form td {
        border: 1px solid #ddd;
        padding: 12px;
        background-color: #f9f9f9;
    }
    .pr-request-form td input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        box-sizing: border-box;
    }
    .pr-request-form .form-footer {
        margin-top: 25px;
        padding: 20px 0;
        border-top: 1px solid #eee;
    }
    .pr-request-form .checkbox-group {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 20px;
    }
    .pr-request-form .checkbox-group label {
        display: flex;
        align-items: center;
        margin-top: 0;
        font-weight: normal;
        cursor: pointer;
    }
    .pr-request-form .checkbox-group input[type="checkbox"] {
        margin-right: 8px;
        transform: scale(1.2);
    }
    .pr-request-form .submit-btn {
        background-color: #2f3b6c;
        color: white;
        padding: 12px 30px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s;
    }
    .pr-request-form .submit-btn:hover {
        background-color: #1e2a5e;
    }
    .form-message {
        padding: 15px;
        margin: 20px 0;
        border-radius: 5px;
        border-left: 4px solid;
        font-weight: bold;
    }
    .form-message.success {
        background-color: #d4edda;
        color: #155724;
        border-left-color: #28a745;
    }
    .form-message.error {
        background-color: #f8d7da;
        color: #721c24;
        border-left-color: #dc3545;
    }
    .form-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid #2f3b6c;
    }
    .form-header h3 {
        color: #2f3b6c;
        margin: 0;
        font-size: 24px;
    }
    .required {
        color: #dc3545;
    }
    .datetime-display {
        background-color: #f8f9fa;
        padding: 8px 12px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        font-weight: bold;
        color: #495057;
        display: inline-block;
        min-width: 200px;
    }
    .current-datetime {
        margin-bottom: 15px;
        padding: 10px;
        background-color: #e9ecef;
        border-radius: 5px;
    }
</style>

<div class="pr-request-form">
    <div class="form-header">
        <h3>REQUEST FOR STUDENT PERMANENT RECORD</h3>
    </div>
    
    <!-- Message display area -->
    <div id="form-message" class="form-message" style="display: none;"></div>

    <!-- Current Date and Time Display -->
    <div class="current-datetime">
        <p><strong>The Principal / Registrar</strong></p>
        <p>
            <strong>Date: </strong>
            <span id="currentDateTime" class="datetime-display">Loading...</span>
        </p>
    </div>

    <p><strong>Sir / Madam:</strong></p>

    <p style="margin-bottom: 25px;">
        Please furnish us with the Permanent Record (Form 137 / SF10) along with other pertinent documents 
        (Form 137-A/SF10-ES) of the following student/s who is/ are temporarily enrolled in this school 
        upon presentation of their Form 138/SF9.
    </p>

    <form method="post" action="">
        <input type="hidden" name="send_record_request" value="1">
        <input type="hidden" name="submission_datetime" id="submissionDatetime" value="">

        <table>
            <thead>
                <tr>
                    <th>Name of Student/s <span class="required">*</span></th>
                    <th>LRN <span class="required">*</span></th>
                    <th>School Year <span class="required">*</span></th>
                    <th>Grade and Section <span class="required">*</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <input type="text" name="student_name[]" required 
                               placeholder="Full Name" title="Enter student's full name">
                    </td>
                    <td>
                        <input type="text" name="student_lrn[]" required 
                               placeholder="Learner Reference Number" title="Enter 12-digit LRN">
                    </td>
                    <td>
                        <input type="text" name="school_year[]" required 
                               placeholder="e.g., 2023-2024" title="Enter school year">
                    </td>
                    <td>
                        <input type="text" name="grade_section[]" required 
                               placeholder="e.g., Grade 7 - Hope" title="Enter grade and section">
                    </td>
                </tr>
                <!-- You can add more rows here if needed -->
            </tbody>
        </table>

        <div class="form-footer">
            <div class="checkbox-group">
                <label>
                    <input type="checkbox" name="request_type[]" value="1st Request"> 
                    <strong>1st Request</strong>
                </label>
                <label>
                    <input type="checkbox" name="request_type[]" value="2nd Request"> 
                    <strong>2nd Request</strong>
                </label>
                <label>
                    <input type="checkbox" name="request_type[]" value="Urgent"> 
                    <strong>Urgent</strong>
                </label>
                <label>
                    <input type="checkbox" name="request_type[]" value="Please entrust to the bearer"> 
                    <strong>Please entrust to the bearer</strong>
                </label>
            </div>

            <div style="text-align: center;">
                <button type="submit" class="submit-btn">Submit Request</button>
            </div>
        </div>
    </form>
</div>

<script>
// Function to update date and time display
function updateDateTime() {
    const now = new Date();
    
    // Format options for date
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    
    // Format options for time
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
    
    // Update display
    document.getElementById('currentDateTime').textContent = 
        `${formattedDate} at ${formattedTime}`;
    
    // Update hidden field for form submission (ISO format for consistency)
    document.getElementById('submissionDatetime').value = now.toISOString();
}

// Function to initialize date/time and set up auto-update
function initializeDateTime() {
    // Initial update
    updateDateTime();
    
    // Update every second to keep time current
    setInterval(updateDateTime, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date and time
    initializeDateTime();
    
    const form = document.querySelector('.pr-request-form form');
    const messageDiv = document.getElementById('form-message');
    
    // Check for URL parameters to show messages
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    
    if (status && message) {
        messageDiv.textContent = decodeURIComponent(message);
        messageDiv.className = 'form-message ' + status;
        messageDiv.style.display = 'block';
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Form validation
    form.addEventListener('submit', function(e) {
        // Ensure we have the latest datetime before submission
        updateDateTime();
        
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = '#dc3545';
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            messageDiv.textContent = 'Please fill in all required fields.';
            messageDiv.className = 'form-message error';
            messageDiv.style.display = 'block';
            messageDiv.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // Clear error styles when user starts typing
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(220, 53, 69)') {
                this.style.borderColor = '';
            }
        });
    }); 
});
</script>
