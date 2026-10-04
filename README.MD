# Wiki Archive
A small, open-source wiki that runs for free on Cloudflare. Articles live in a D1 database, a Worker serves the API, and the site itself is plain HTML and JavaScript. No frameworks, no servers to babysit.
#  Features
* Articles with a photo and short summary infobox
* Categories, with filtering on the home page
* Login and signup, with salted password hashing
* Account lockout after 3 wrong password attempts
* Change password (asks for the old one first)
* Full edit history, so nothing is ever lost
* JSON import for adding lots of articles at once
* No email required for accounts
How it works
wiki is your database (D1). It holds articles, edit history and user accounts.
wikiapi is a Worker that sits between the site and the database.
wikiarchive is a Worker that serves your actual website files.
# Get Started
Want your own copy? You only need a free Cloudflare account. Follow the full walkthrough in guide.md. It covers the database, the API, login security, edit history, the site, and troubleshooting, all from the dashboard with no terminal.

More Projects

If you enjoyed this one, come and see what else I'm building, especially the Zythos series.
Zythos is a custom operating system written in C for x86, with its own two-stage BIOS bootloader, kernel, FAT32 support and a small shell. It's open source under GPL-2.0: github.com/xetch-mirror/Zythos
Around it there's a whole family of tools, all living under the organization:
BCC, a small C compiler/interpreter derived from c4
zim ("Z Improved"), a vi-style text editor
coreutils, ttar ("Tiny tar") and zsub (a Brainfuck interpreter) for the userland
Ports of Lua, SQLite and chibicc (as ZCC) to run on Zythos

Credits

Created by: [User]

Built on: Cloudflare Workers and D1

Password hashing: the Web Crypto API (PBKDF2)

Some parts written with help from: Claude, by Anthropic

Thanks to: everyone who tries it, forks it and sends fixes

Wiki Archive is open source. If you build something with it, I'd love to see it.

We are sorry for using AI, we just don't know many of JavaScript