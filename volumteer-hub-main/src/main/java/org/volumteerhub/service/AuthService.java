package org.volumteerhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.volumteerhub.dto.ApiResponse;
import org.volumteerhub.dto.LoginRequest;
import org.volumteerhub.dto.LoginResponse;
import org.volumteerhub.model.User;
import org.volumteerhub.repository.UserRepository;
import org.volumteerhub.util.JwtUtil;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public ApiResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password. Please try again.");
        }

        String token = JwtUtil.generateToken(user.getUsername());
        return new LoginResponse(token, user.getUsername());
    }
}
