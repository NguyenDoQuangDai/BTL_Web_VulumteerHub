package org.volumteerhub.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.volumteerhub.dto.ApiResponse;
import org.volumteerhub.dto.LoginRequest;
import org.volumteerhub.service.AuthService;
import org.volumteerhub.dto.MessageResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            ApiResponse response = authService.login(request);
            return ResponseEntity.ok(response); // HTTP 200 for success
        } catch (RuntimeException e) {
            ApiResponse errorResponse = new MessageResponse(e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse); // HTTP 401 for unauthorized
        }
    }
}
