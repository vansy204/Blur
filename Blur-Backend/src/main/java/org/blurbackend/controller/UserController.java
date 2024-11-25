package org.blurbackend.controller;

import lombok.RequiredArgsConstructor;
import org.blurbackend.enums.Role;
import org.blurbackend.enums.UserStatus;
import org.blurbackend.model.User;
import org.blurbackend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;


    @GetMapping("/id/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        User user = userService.findUserById(id);
        return new ResponseEntity<>(user,HttpStatus.OK);
    }
    @GetMapping("/username/{userName}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String userName) {
        User user = userService.findUserByUsername(userName);
        return new ResponseEntity<>(user,HttpStatus.OK);
    }
    @GetMapping("/m/{userIds}")
    public ResponseEntity<List<User>> getUsersByIds(@PathVariable List<Integer> userIds) {
        List<User> users = userService.findUserByIds(userIds);
        return new ResponseEntity<>(users,HttpStatus.OK);
    }
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUser(@RequestParam("q") String query) {
        List<User> users = userService.searchUser(query);
        return new ResponseEntity<>(users,HttpStatus.OK);
    }
    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable Role role) {
        List<User> users = userService.findByRole(role);
        return new ResponseEntity<>(users,HttpStatus.OK);
    }
    @GetMapping("/status/{userStatus}")
    public ResponseEntity<List<User>> getUsersByStatus(@PathVariable UserStatus userStatus) {
        List<User> users = userService.findByUserStatus(userStatus);
        return new ResponseEntity<>(users,HttpStatus.OK);
    }
    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAll();
        return new ResponseEntity<>(users,HttpStatus.OK);
    }

}
