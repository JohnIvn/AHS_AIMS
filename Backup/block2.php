<div class="pr-request-form">
    <div class="form-header">
        <div class="letterhead">
            <div class="school-info">
                <h2>YOUR SCHOOL NAME</h2>
                <p>School Address Line 1</p>
                <p>City, State, ZIP Code</p>
                <p>Phone: (123) 456-7890 | Email: info@yourschool.edu</p>
            </div>
        </div>
    </div>
    
    <!-- Message display area -->
    <div id="form-message" class="form-message" style="display: none;"></div>

    <!-- Current Date Display -->
    <div class="letter-date">
        <p id="currentDateTime">Loading date...</p>
    </div>

    <div class="letter-content">
        <div class="recipient-info">
            <p><strong>The Principal / Registrar</strong></p>
            <p>Previous School Name</p>
            <p>School Address</p>
            <p>City, State, ZIP Code</p>
        </div>

        <div class="salutation">
            <p><strong>Sir / Madam:</strong></p>
        </div>

        <div class="letter-body">
            <p>
                Please furnish us with the Permanent Record (Form 137 / SF10) along with other pertinent documents 
                (Form 137-A/SF10-ES) of the following student/s who is/ are temporarily enrolled in this school 
                upon presentation of their Form 138/SF9.
            </p>

            <form method="post" action="">
                <input type="hidden" name="send_record_request" value="1">
                <input type="hidden" name="submission_datetime" id="submissionDatetime" value="">

                <div class="student-table">
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
                            <!-- Additional rows can be added here -->
                        </tbody>
                    </table>
                </div>

                <div class="request-options">
                    <p><strong>Request Type:</strong></p>
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
                </div>

                <div class="closing-section">
                    <p>Thank you for your cooperation.</p>
                    <p>Very truly yours,</p>
                    
                    <div class="signature-area">
                        <p>_________________________</p>
                        <p><strong>School Registrar / Authorized Representative</strong></p>
                        <p>Your School Name</p>
                    </div>
                </div>

                <div class="form-footer">
                    <div style="text-align: center;">
                        <button type="submit" class="submit-btn">Submit Request</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    .pr-request-form {
        font-family: 'Times New Roman', serif;
        max-width: 800px;
        margin: 20px auto;
        padding: 40px;
        border: 1px solid #ccc;
        line-height: 1.6;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        position: relative;
    }
    
    .letterhead {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #2f3b6c;
    }
    
    .school-info h2 {
        color: #2f3b6c;
        margin: 0 0 10px 0;
        font-size: 24px;
        letter-spacing: 1px;
    }
    
    .school-info p {
        margin: 5px 0;
        color: #555;
    }
    
    .letter-date {
        text-align: right;
        margin-bottom: 30px;
        font-style: italic;
    }
    
    .recipient-info {
        margin-bottom: 20px;
    }
    
    .recipient-info p {
        margin: 5px 0;
    }
    
    .salutation {
        margin-bottom: 15px;
    }
    
    .letter-body p {
        margin-bottom: 15px;
        text-align: justify;
    }
    
    .student-table {
        margin: 25px 0;
    }
    
    .student-table table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #333;
    }
    
    .student-table th {
        background-color: #f0f0f0;
        color: #333;
        padding: 12px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #444;
    }
    
    .student-table td {
        border: 1px solid #ddd;
        padding: 12px;
        background-color: #fff;
    }
    
    .student-table td input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        box-sizing: border-box;
        font-family: 'Times New Roman', serif;
    }
    
    .request-options {
        margin: 25px 0;
    }
    
    .checkbox-group {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 10px;
    }
    
    .checkbox-group label {
        display: flex;
        align-items: center;
        margin-top: 0;
        font-weight: normal;
        cursor: pointer;
    }
    
    .checkbox-group input[type="checkbox"] {
        margin-right: 8px;
        transform: scale(1.2);
    }
    
    .closing-section {
        margin-top: 40px;
    }
    
    .signature-area {
        margin-top: 50px;
    }
    
    .signature-area p {
        margin: 5px 0;
    }
    
    .form-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        text-align: center;
    }
    
    .submit-btn {
        background-color: #2f3b6c;
        color: white;
        padding: 12px 30px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: background-color 0.3s;
        font-family: 'Times New Roman', serif;
    }
    
    .submit-btn:hover {
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
    
    .required {
        color: #dc3545;
    }
    
    @media print {
        .pr-request-form {
            box-shadow: none;
            border: 1px solid #000;
        }
        
        .submit-btn {
            display: none;
        }
    }
</style>

<script>
// Function to update date display
function updateDateTime() {
    const now = new Date();
    
    // Format options for date
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    
    // Update display
    document.getElementById('currentDateTime').textContent = formattedDate;
    
    // Update hidden field for form submission (ISO format for consistency)
    document.getElementById('submissionDatetime').value = now.toISOString();
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date
    updateDateTime();
    
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
