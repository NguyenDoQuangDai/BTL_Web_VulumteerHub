package org.volumteerhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.volumteerhub.common.enumeration.UserRole;
import org.volumteerhub.common.exception.ResourceNotFoundException;
import org.volumteerhub.common.exception.UnauthorizedAccessException;
import org.volumteerhub.dto.CreateUserRequest;
import org.volumteerhub.dto.UserResponse;
import org.volumteerhub.model.User;
import org.volumteerhub.repository.UserRepository;
import org.volumteerhub.specification.UserSpecifications;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // CREATE
    public UserResponse createUser(CreateUserRequest req) {
        User user = User.builder()
                .firstname(req.getFirstname())
                .lastname(req.getLastname())
                .username(req.getUsername())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(UserRole.USER)
                .isActive(Boolean.FALSE)
                .build();

        userRepository.save(user);

        return UserResponse.builder()
                .id(user.getId())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .username(user.getUsername())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserResponse toDto(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .username(user.getUsername())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private User findUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    // READ BY ID
    public UserResponse get(UUID id) {
        return toDto(findUserById(id));
    }

    // LIST + FILTER (Following EventService pattern)
    public Page<UserResponse> list(UserRole role, Boolean isActive, String username, Pageable pageable) {
        Specification<User> spec = Specification.allOf(
                UserSpecifications.hasRole(role),
                UserSpecifications.isActive(isActive),
                UserSpecifications.usernameContains(username)
        );

        return userRepository.findAll(spec, pageable).map(this::toDto);
    }

    // UPDATE
    public UserResponse update(UUID id, CreateUserRequest req) {
        User userToUpdate = findUserById(id);
        User currentUser = getCurrentAuthenticatedUser();

        // Check if user is updating themselves OR is an admin
        validateOwnerOrAdmin(userToUpdate, currentUser);

        if (req.getFirstname() != null) userToUpdate.setFirstname(req.getFirstname());
        if (req.getLastname() != null) userToUpdate.setLastname(req.getLastname());
        if (req.getPassword() != null) {
            userToUpdate.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        return toDto(userRepository.save(userToUpdate));
    }

    // DELETE
    public void delete() {
        User currentUser = getCurrentAuthenticatedUser();
        userRepository.delete(currentUser);
    }


    // === ADMIN === //

    // Activate/deactivate user
    public UserResponse setActiveStageUser(UUID id, Boolean active) {
        if (!isCurrentUserAdmin()) {
            throw new UnauthorizedAccessException("Admin only operation.");
        }

        User user = findUserById(id);
        user.setIsActive(active);
        userRepository.save(user);

        return toDto(user);
    }

    // UTILS

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        String role = user.getRole().name();

        Collection<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority(role)
        );

        // Return the Spring Security User object
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                authorities
        );
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedAccessException("User is not authenticated.");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }

    public boolean isCurrentUserAdmin() {

        User currentUser = this.getCurrentAuthenticatedUser();

        return currentUser.getRole() == UserRole.ADMIN;
    }

    public void validateOwnerOrAdmin(User resourceOwner, User currentUser) {
        if (!isCurrentUserAdmin() && !resourceOwner.equals(currentUser)) {
            throw new UnauthorizedAccessException("Operation not permitted.");
        }
    }
}
