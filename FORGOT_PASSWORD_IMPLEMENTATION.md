// Example implementation structure

// 1. Add to User entity or create PasswordResetToken entity
@Entity
public class PasswordResetToken {
    @Id
    private String token;
    
    @OneToOne
    private User user;
    
    private Instant expiryDate;
    private boolean used;
}

// 2. Email service
@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    
    public void sendPasswordResetEmail(String email, String resetLink) {
        // Send email with reset link
    }
}

// 3. Password reset controller
@PostMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
    // 1. Find user by email
    // 2. Generate reset token (UUID + expiry)
    // 3. Save token to database
    // 4. Send email with reset link
    // 5. Return success message
}

@PostMapping("/reset-password")
public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
    // 1. Validate token (exists, not expired, not used)
    // 2. Update user password
    // 3. Mark token as used
    // 4. Return success
}