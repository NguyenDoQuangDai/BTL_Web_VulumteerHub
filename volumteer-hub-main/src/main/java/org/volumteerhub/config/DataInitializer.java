package org.volumteerhub.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.volumteerhub.common.enumeration.UserRole;
import org.volumteerhub.model.User;
import org.volumteerhub.repository.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    //tạo tài khoản admin mặc định khi khởi động ứng dụng
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdminUser();
    }

    private void createDefaultAdminUser() {
        String adminUsername = "admin1@gmail.com";
        
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            User adminUser = User.builder()
                    .firstname("System")
                    .lastname("Administrator")
                    .username(adminUsername)
                    .passwordHash(passwordEncoder.encode("admin123")) // Change this password!
                    .role(UserRole.ADMIN)
                    .build();

            userRepository.save(adminUser);
            
            log.info("Created default admin user - Username: admin, Password: admin123");
            log.warn("IMPORTANT: Please change the default admin password after first login!");
        } else {
            log.info("Admin user already exists");
        }
    }
}
