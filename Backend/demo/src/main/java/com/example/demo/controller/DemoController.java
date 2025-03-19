package com.example.demo.controller;

import com.example.demo.model.Registry;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class DemoController {
    @RequestMapping(value = "/registry",method = RequestMethod.POST)
    public String registry(Model model) {
        Registry registryForm = new Registry();
        model.addAttribute("registryForm",registryForm );
        return "registry";
    }



}
