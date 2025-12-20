package org.volumteerhub.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.volumteerhub.common.enumeration.UserRole;
import org.volumteerhub.common.validation.OnCreate;
import org.volumteerhub.common.validation.OnUpdate;
import org.volumteerhub.dto.CreateUserRequest;
import org.volumteerhub.dto.UserResponse;
import org.volumteerhub.service.UserService;

import java.util.UUID;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Validated(OnCreate.class) @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @GetMapping
    public ResponseEntity<PagedModel<EntityModel<UserResponse>>> listUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String username,
            Pageable pageable,
            PagedResourcesAssembler<UserResponse> assembler) {

        Page<UserResponse> page = userService.list(role, isActive, username, pageable);

        PagedModel<EntityModel<UserResponse>> resources = assembler.toModel(page, user -> EntityModel.of(user,
                linkTo(methodOn(UserController.class).getUser(user.getId())).withSelfRel()
        ));

        return ResponseEntity.ok(resources);
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return userService.get(id);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable UUID id,
            @Validated(OnUpdate.class) @RequestBody CreateUserRequest request) {
        return userService.update(id, request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser() {
        userService.delete();
    }
}
