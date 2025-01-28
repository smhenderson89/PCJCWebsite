#!/usr/bin/env python3

import sys
import os.path
import re

# This program will generate a list of all of the awards on the PCJC website.
# Including the full directory name, so that the award html page and jpgs can be
# downloaded easily.

def main(argv):

  domain = "http://paccentraljc.org/"
  currentdirectory = ""
  thisfile = ""
  
  #open the filelist.txt file
  filename = "filelist.txt"
  
  with open(filename, 'r') as filelist:
    lines = filelist.readlines()
    for row in lines:
      # ./[0.9]?: indicates a directory with awards in it
      # interesting case, there are several of these: ./20170801/20170619:
      regex = "^\.\/[\d\/]+:"
      if re.match(regex, row):
        currentdirectory = row.strip()
        currentdirectory = currentdirectory[2:(len(currentdirectory)-1)] + "/"
        print("DEBUG Found a directory:{}".format(currentdirectory))
        
      # [0.9]?.html is an award html file - save this file and put it in ./awards/
      regex = "\d+\.html"
      if re.match(regex, row):
        thisfile = row.strip()
        # retrieve this file
        fullname = domain + currentdirectory + thisfile
        print("DEBUG Found an award:{}".format(fullname))
        # save it in ./awards/
        
      # [0.9]?.jpg is an award image file - save this one
      #if row is an award image file:
      # retrieve the image
      # save it in ./awards/
      
      # a blank line indicates the end of a sub directory
      if len(row.strip()) < 1:
        # This is when we should reset any directory information
        currentdirectory = ""
        #print ("DEBUG found the end of a directory".format(row))
      # In any other circumstances, we should do nothing with the line
  
if __name__ == "__main__":
  main(sys.argv)


