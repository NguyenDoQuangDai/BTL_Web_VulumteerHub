package org.volumteerhub.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.volumteerhub.dto.UserResponse;
import org.volumteerhub.service.UserService;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @PostMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.OK)
    public UserResponse deactivateUser(@PathVariable UUID id) {
        return userService.setActiveStageUser(id, Boolean.FALSE);
    }

    @PostMapping("/{id}/activate")
    @ResponseStatus(HttpStatus.OK)
    public UserResponse activateUser(@PathVariable UUID id) {
        return userService.setActiveStageUser(id, Boolean.TRUE);
    }
}
