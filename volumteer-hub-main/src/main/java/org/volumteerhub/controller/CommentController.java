package org.volumteerhub.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.volumteerhub.dto.CommentDto;
import org.volumteerhub.service.CommentService;

import java.util.UUID;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // LIST COMMENTS FOR POST
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<PagedModel<EntityModel<CommentDto>>> listByPost(
            @PathVariable UUID postId,
            Pageable pageable,
            PagedResourcesAssembler<CommentDto> assembler) {

        Page<CommentDto> page = commentService.listByPost(postId, pageable);

        PagedModel<EntityModel<CommentDto>> resources = assembler.toModel(page, dto ->
                EntityModel.of(dto,
                        linkTo(methodOn(CommentController.class).listByPost(postId, pageable, assembler)).withSelfRel()
                )
        );

        return ResponseEntity.ok(resources);
    }

    // CREATE COMMENT
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDto> createComment(
            @PathVariable UUID postId,
            @RequestBody CommentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.create(postId, dto));
    }

    // DELETE COMMENT
    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable UUID commentId) {
        commentService.delete(commentId);
    }
}
