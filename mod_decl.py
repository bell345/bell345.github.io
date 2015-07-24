#!/usr/bin/python3

import json
import os
import shutil
from sys import argv
from datetime import datetime, timedelta

if len(argv) < 2:
    exit("Number of arguments required is 1. {0} arguments were given.".format(len(argv) - 1))

shutil.copy2(argv[1], argv[1]+".bak")
fp = open(argv[1], "r")

declaration = json.load(fp)

if declaration["version"] != 2:
    exit("Version number invalid.")

print("File loaded successfully.")

old_declaration = declaration
start_time = datetime.now()

fp.close()

def rollback(force=False):
    global declaration
    global start_time
    
    if force or ask("You sure? All your changes from the past {0} minutes will be lost! [y/n]: ".format((datetime.now() - start_time).total_seconds() // 60), ["y", "n"]):
        declaration = old_declaration
        shutil.copy2(argv[1]+".bak", argv[1])
        start_time = datetime.now()
        print("Rollback successful.")

def save():
    try:
        write_fp = open(argv[1], "w")
        json.dump(declaration, write_fp, indent=4)
        write_fp.close()
        print("Save successful!")
    except Exception as e:
        rollback(True)
        print("Save failed: {0}".format(e))
    

def find_project(proj_id):
    for item in declaration["projects"]:
        if item["id"] == proj_id:
            return item
    return None
        
def try_again_on_error(func, *args):
    if not func(*args):
        decision = ask("Try again? [y/n]: ", ["y", "n"])
        if decision == "y":
            try_again_on_error(func, *args)
        else:
            return False
    else:
        return True

def ask(prompt, option_list=[], retry=-1):
    if len(option_list) > 1:
        decision = input(prompt).lower()
        items_str = ""
        
        for item in option_list:
            if decision.find(item) == 0:
                return item
            else:
                items_str += item + ", "
        
        items_str = items_str.rstrip(", ") 
        
        if (retry == -1) or (retry > 0):
            print("{0} was an invalid response. Valid responses include: {1}".format(decision, items_str))
            return ask(prompt, option_list, retry)
        else:
            return None
    else:
        return input(prompt)

def new_project():
    new_id = ask("Project ID: ")
    if find_project(new_id) != None:
        print("A project with this name already exists.")
        return False
    new_obj = {}
    new_obj["id"] = new_id
    new_obj["title"] = ask("Project name: ")
    new_obj["version"] = "0.1"
    new_obj["updated"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    declaration["projects"].insert(0, new_obj)
    
    new_path = "{}/{}".format(declaration["path"], new_obj["id"])
    new_page = new_path + "/index.html"
    
    if not os.path.exists(new_path):
        os.mkdir(new_path)
        
    shutil.copy(".new/template.html", new_page)
    shutil.copy(".new/template.css", "assets/css/{}/{}.css".format(declaration["id"], new_obj["id"]))
    shutil.copy(".new/template.js", "assets/js/{}/{}.js".format(declaration["id"], new_obj["id"]))
    
    innerhtml = ""
    with open(new_page, "r") as page_fp:
        innerhtml = page_fp.read()
    
    innerhtml = innerhtml.replace("$page_id", declaration["id"]).replace("$id", new_obj["id"]).replace("$title", new_obj["title"])
    
    with open(new_page, "w") as page_fp:
        page_fp.write(innerhtml)
    
    print("Project {0} created.".format(new_obj["id"]))
    
    edit_or_not = ask("Would you like to edit the new project? [y/n]: ", ["y", "n"])
    
    if edit_or_not == "y":
        try_again_on_error(edit_project, new_id)
    
    return True


def get_property(obj):
    prop_to_change = ask("Enter a new/existing property name to modify (enter nothing to list): ")
    if prop_to_change == "":
        for prop in obj:
            print("{0} = {1}".format(prop, obj[prop]))
        return get_property(obj)
    
    return prop_to_change

def edit_property(obj, prop):
    if prop in obj:
        ask_str = "Change {0}: {1} -> ".format(prop, obj[prop])
    else:
        ask_str = "Create {0}: ".format(prop)
    
    new_val = ask(ask_str)
    obj[prop] = new_val
    print("Property {0} changed to {1}.".format(prop, new_val))
    
    compound = ask("Edit another property? [y/n]: ", ["y", "n"])
    if compound == "y":
        try_again_on_error(edit_property, obj, prop)

def edit_project(proj_id=None):
    if proj_id == None:
        proj_id = ask("Project ID (enter nothing to list): ")
        if proj_id == "":
            for prop in declaration["projects"]:
                print("[{0}] {1} v{2}".format(prop["id"], prop["title"], prop["version"]))
            return edit_project()
    
    proj = find_project(proj_id)
    if proj == None:
        print("Unable to find project.")
        return False
    
    prop_to_change = get_property(proj)
    edit_property(proj, prop_to_change)
    proj["updated"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    compound = ask("Edit another project? [y/n]: ", ["y", "n"])
    if compound == "y":
        try_again_on_error(edit_project)
    
    return True

def loop():
    decision = ask("What would you like to do now?\n[C]reate/[E]dit/[D]elete project, [S]ave/[R]ollback changes or e[X]it?: ", ["c","e","d","s","r","x"])

    if decision == "x":
        if ask("Save first? [y/n]: ", ["y", "n"]) == "y":
            save()
        go_home()
    elif decision == "c":
        try_again_on_error(new_project)
    elif decision == "e":
        try_again_on_error(edit_project)
    elif decision == "r":
        rollback()
    elif decision == "s":
        save()
    
    loop()

def go_home(code=0):
    exit(code)

loop()
