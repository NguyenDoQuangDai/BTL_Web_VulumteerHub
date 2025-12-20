package org.volumteerhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.volumteerhub.common.exception.ResourceNotFoundException;
import org.volumteerhub.common.exception.UnauthorizedAccessException;
import org.volumteerhub.dto.CommentDto;
import org.volumteerhub.model.Comment;
import org.volumteerhub.model.Post;
import org.volumteerhub.model.User;
import org.volumteerhub.repository.CommentRepository;
import org.volumteerhub.repository.PostRepository;

import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    private CommentDto toDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPost().getId());
        if (comment.getParent() != null) {
            dto.setParentId(comment.getParent().getId());
        }
        dto.setUserId(comment.getUser().getId());
        dto.setUsername(comment.getUser().getUsername());
        dto.setUserRole(comment.getUser().getRole().name());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        
        if (comment.getReplies() != null) {
            dto.setReplies(comment.getReplies().stream()
                    .map(this::toDto)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    @Transactional
    public CommentDto create(UUID postId, CommentDto dto) {
        User user = userService.getCurrentAuthenticatedUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Comment comment = Comment.builder()
                .content(dto.getContent())
                .user(user)
                .post(post)
                .build();

        if (dto.getParentId() != null) {
            Comment parent = commentRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            comment.setParent(parent);
        }

        return toDto(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public Page<CommentDto> listByPost(UUID postId, Pageable pageable) {
        return commentRepository.findByPostIdAndParentIsNull(postId, pageable)
                .map(this::toDto);
    }

    @Transactional
    public void delete(UUID id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        User user = userService.getCurrentAuthenticatedUser();
        if (!comment.getUser().getId().equals(user.getId()) && !userService.isCurrentUserAdmin()) {
             throw new UnauthorizedAccessException("Not authorized to delete this comment");
        }

        commentRepository.delete(comment);
    }
}
