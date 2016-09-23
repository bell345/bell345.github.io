#!/usr/bin/python3

import json
import os
import shutil
from sys import argv, stderr
from datetime import datetime, timedelta

def bail_usage(msg=None):
    print("{} file command [ID] [file2]".format(argv[0]))
    print("  command can be any of the following:")
    print("    list: lists all of the project names, versions and IDs.")
    print("    create: creates a new project in an interactive prompt.")
    print("    edit: edits an existing project's properties in an interactive"+\
               " prompt given a project ID.")
    print("    remove: removes a project given a project ID.")
    print("")
    print("(C) Thomas Bell 2015/2016, MIT License")
    print("")
    print(msg, file=stderr)
    exit(1)

""" Prep """

if len(argv) < 2:
    bail_usage("Number of arguments required is 1. {0} arguments were given.".format(len(argv) - 1))

def get_filename(arg):
    if arg[-5:] != ".json":
        if arg[-1:] != "/":
            arg += "/"
        arg += "declare.json"
    return arg

def load(arg):
    global declaration
    global old_declaration
    global start_time

    fname = get_filename(arg)

    shutil.copy2(fname, fname+".bak")
    fp = open(fname, "r")

    declaration = json.load(fp)

    if declaration["version"] != 2:
        exit("Version number invalid.")
    elif declaration["role"] != "project-declaration":
        exit("Declaration is valid, but does not specify a project declaration.")

    old_declaration = declaration
    start_time = datetime.now()

    fp.close()

load(argv[1])

if len(argv) < 3:
    bail_usage("Command needs to be supplied.")

command = argv[2]
    
""" Utility """

def find_project(proj_id):
    for item in declaration["projects"]:
        if item["id"] == proj_id:
            return item
    return None

def delete_project(proj_id):
    for i,item in enumerate(declaration["projects"]):
        if item["id"] == proj_id:
            del declaration["projects"][i]

def ask(prompt):
    return input(prompt)

def get_property(obj):
    prop_to_change = input("Enter a new/existing property name to modify: ")
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

""" File management """

def rollback():
    global declaration
    global start_time
    
    declaration = old_declaration
    shutil.copy2(fname+".bak", fname)
    start_time = datetime.now()

def save():

    # sort by date, descending order
    declaration["projects"].sort(key=lambda o:o["updated"])
    declaration["projects"] = declaration["projects"][::-1]

    try:
        write_fp = open(fname, "w")
        json.dump(declaration, write_fp, indent=4)
        write_fp.close()
    except Exception as e:
        rollback()
        print("Save failed: {0}".format(e))


""" Commands """

def new_project():
    new_id = ask("Project ID: ")
    if find_project(new_id) != None:
        exit("A project with this name already exists.")

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

def list_projects():
   for prop in declaration["projects"]:
       print("[{}] {} v{}".format(prop["id"], prop["title"], prop["version"]))

def edit_project(proj_id=None):
    if proj_id == None:
        exit("No project ID to edit was supplied.")

    proj = find_project(proj_id)
    if proj == None:
        exit("Unable to find project {}.".format(proj_id))
    
    prop_to_change = get_property(proj)
    edit_property(proj, prop_to_change)
    proj["updated"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    save()

def remove_project(proj_id=None):
    if proj_id == None:
        exit("No project ID to remove was supplied.")

    proj = find_project(proj_id)
    if proj == None:
        exit("Unable to find project {}.".format(proj_id))

    print("Removing project {}:".format(proj_id))
    for prop in proj:
        print("{0} = {1}".format(prop, proj[prop]))

    user_in = input("Are you sure you want to delete this project (y/n): ")
    if user_in[0].lower() == 'y':
        delete_project(proj_id)
        save()
        print("Project deleted.")

    else:
        print("Project not deleted.")

if command == "create":
    new_project()
    save()
elif command == "edit":
    if len(argv) < 4:
        exit("Project ID needs to be supplied. Use the 'list' command to find valid project IDs.")
    edit_project(argv[3])
elif command == "list":
    list_projects()
elif command  == "remove":
    if len(argv) < 4:
        exit("Project ID needs to be supplied. Use the 'list' command to find valid project IDs.")
    remove_project(argv[3])
else:
    exit("{} is not a valid command.".format(command))
