# Pitch — ITE300 Retake Checker

Presenter: the ITE300 teacher (one speaker for all five beats).

## Script (about 3 minutes)

### 1. The person (~45s)

The day I release P2 results, my inbox explodes.

"Ma'am, what do I need to retake?" "Ma'am, am I okay?" "Ma'am, what
score do I need?" One message, then ten, then fifty.

I teach ITE300. I have four sections, about fifty students each. That's
around two hundred students, and every one of them needs a different
answer. One student has to retake two wrap-up quizzes. Another has to
retake the P1 check-in and score at least eighty-seven. Another has
nothing to retake at all, but they don't know that, so they message me
anyway.

### 2. Today (~30s)

Right now, I answer every message by hand. I open my Google Sheet, find
the student, read their row, and type the answer back. Then I do it
again. And again.

I can't just share the sheet. It has every student's grades on it.
Posting it would expose my students to each other, and it would cost me
their trust.

So the answers are private, but the cost is my time.

### 3. Our fix (~45s)

The ITE300 Retake Checker lets a student see their own retakes, and
nobody else's, in ten seconds.

Each student gets a secret six-letter code from me, on a slip of paper
or by email. They open the website and type their student number and
their code. They see their name, their section, the wrap-up quizzes they
need to retake, the check-ins they need to retake, and the minimum score
for each one. If they're all clear, it tells them so.

On my side, I keep using my Google Sheet. When results change, I
download it and upload it to the site. That's it.

### 4. The demo moment (~30s)

In Session 3, I'll show you three things live. I upload my section's
sheet. A student types their number and code and sees exactly what to
retake. Then someone types a wrong code, and the site shows nothing at
all. No names, no hints, no grades.

### 5. How we'll know (~30s)

My section BSIT2-9 will use it first. That's fifty-five real students.

Before launch, I'll count how many retake messages I get after a normal
release. After launch, I'll count again for BSIT2-9.

If my inbox goes quiet, it worked. I'll bring both numbers to Session 3.

## Three hard questions

**1. "You don't actually know how many messages you get. How do you
know this is a big problem?"**

This is the weakest point. `docs/PROBLEM.md` has no "before" number
yet. An honest answer: "Fair. I know the messages flood my inbox, but I
haven't counted them. I'm counting them after this release, and I'll
bring the number to Session 3." **Strengthen it before you present:**
scroll back through your inbox to the last results release and count the
retake questions. Even "about 40 in two days" turns a feeling into
evidence. If you can, screenshot the inbox with the names blurred.

**2. "Why not just use your LMS? It already shows students their own
grades."**

Suggested answer: "The LMS shows grades, but not what to retake or what
score each student needs on each retake. I work that out in my sheet,
and that's exactly the part students keep asking me about. Putting it in
the LMS would mean entering it again by hand for two hundred students."
Before you present, check whether your LMS really can't do this. If it
can, the facilitator will know.

**3. "What stops a student from looking at a classmate's record?"**

Suggested answer: "The student number alone isn't enough, because
classmates often know each other's numbers. You also need a secret code
that only I give out, privately. A wrong code shows nothing. Only I can
log in to see the full list, and real student data never goes into the
code on GitHub."
