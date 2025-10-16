<?php
/**
 * Theme functions and definitions
 *
 * @package HelloBiz
 */

use HelloBiz\Theme;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'HELLO_BIZ_ELEMENTOR_VERSION', '1.2.0' );
define( 'EHP_THEME_SLUG', 'hello-biz' );

define( 'HELLO_BIZ_PATH', get_template_directory() );
define( 'HELLO_BIZ_URL', get_template_directory_uri() );
define( 'HELLO_BIZ_ASSETS_PATH', HELLO_BIZ_PATH . '/assets/' );
define( 'HELLO_BIZ_ASSETS_URL', HELLO_BIZ_URL . '/assets/' );
define( 'HELLO_BIZ_SCRIPTS_PATH', HELLO_BIZ_ASSETS_PATH . 'js/' );
define( 'HELLO_BIZ_SCRIPTS_URL', HELLO_BIZ_ASSETS_URL . 'js/' );
define( 'HELLO_BIZ_STYLE_PATH', HELLO_BIZ_ASSETS_PATH . 'css/' );
define( 'HELLO_BIZ_STYLE_URL', HELLO_BIZ_ASSETS_URL . 'css/' );
define( 'HELLO_BIZ_IMAGES_PATH', HELLO_BIZ_ASSETS_PATH . 'images/' );
define( 'HELLO_BIZ_IMAGES_URL', HELLO_BIZ_ASSETS_URL . 'images/' );
define( 'HELLO_BIZ_STARTER_IMAGES_PATH', HELLO_BIZ_IMAGES_PATH . 'starter-content/' );
define( 'HELLO_BIZ_STARTER_IMAGES_URL', HELLO_BIZ_IMAGES_URL . 'starter-content/' );

if ( ! isset( $content_width ) ) {
	$content_width = 800; // Pixels.
}

// Init the Theme class
require HELLO_BIZ_PATH . '/theme.php';

Theme::instance();

// ==================== ADD FORM HANDLING CODE BELOW ====================

// Handle the Form 137 Request Submission
add_action( 'init', 'handle_record_request_form' );
function handle_record_request_form() {
    // Check if our form was submitted
    if ( isset( $_POST['send_record_request'] ) ) {
        
        // Basic security check
        if ( ! isset( $_POST['student_name'] ) || ! is_array( $_POST['student_name'] ) ) {
            wp_redirect( add_query_arg( array( 'status' => 'error', 'message' => 'Invalid form data.' ), wp_get_referer() ) );
            exit;
        }

        // Sanitize the data
        $student_names = array_map( 'sanitize_text_field', $_POST['student_name'] );
        $student_lrns = array_map( 'sanitize_text_field', $_POST['student_lrn'] );
        $school_years = array_map( 'sanitize_text_field', $_POST['school_year'] );
        $grade_sections = array_map( 'sanitize_text_field', $_POST['grade_section'] );
        $request_types = isset( $_POST['request_type'] ) ? array_map( 'sanitize_text_field', $_POST['request_type'] ) : array();
        
        // Get submission datetime
        $submission_datetime = isset( $_POST['submission_datetime'] ) ? 
            sanitize_text_field( $_POST['submission_datetime'] ) : 
            current_time( 'mysql' );

        // Format the date for display
        $formatted_date = date( 'F j, Y \a\t g:i A', strtotime( $submission_datetime ) );

        // Build the email content
        $to = get_option( 'admin_email' ); // Sends to the site admin. Change this email as needed.
        $subject = 'Request for Student Permanent Record (Form 137/SF10)';
        
        $message = "A new request for student records has been submitted.\n\n";
        $message .= "SUBMISSION DATE & TIME: " . $formatted_date . "\n\n";
        $message .= "--- STUDENT DETAILS ---\n";
        
        // Loop through all submitted students and add their info
        for ( $i = 0; $i < count( $student_names ); $i++ ) {
            $message .= "Student " . ($i+1) . ":\n";
            $message .= "Name: " . $student_names[$i] . "\n";
            $message .= "LRN: " . $student_lrns[$i] . "\n";
            $message .= "School Year: " . $school_years[$i] . "\n";
            $message .= "Grade & Section: " . $grade_sections[$i] . "\n\n";
        }
        
        $message .= "Request Type: " . implode( ', ', $request_types ) . "\n\n";
        $message .= "This request was submitted from: " . home_url();

        $headers = array('Content-Type: text/plain; charset=UTF-8');

        // Send the email using wp_mail, which is now powered by WP Mail SMTP
        $mail_sent = wp_mail( $to, $subject, $message, $headers );

        // Redirect back to the form page with a success or error message
        if ( $mail_sent ) {
            wp_redirect( add_query_arg( array( 'status' => 'success', 'message' => 'Your request has been sent successfully!' ), wp_get_referer() ) );
        } else {
            wp_redirect( add_query_arg( array( 'status' => 'error', 'message' => 'There was an error sending your request. Please try again.' ), wp_get_referer() ) );
        }
        exit;
    }
}

// ==================== END OF FORM HANDLING CODE ====================
