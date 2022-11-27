import { Router } from 'express';
let router = Router();
import { createHash } from 'crypto';
import * as blockexecute from '../blockchainExecuter';
// login page for jobseeker
router.get('/login', async (req, res) => {
    res.sendFile('/static/jobseeker/login.html', { root: '.' })
})
// job seeker credientials verification
router.post('/login/verfify', async (req, res) => {
    console.log(req.body)
    let username = req.body.username;
    let password = createHash('sha256').update(req.body.password).digest('hex');

    try {
        let usrobj = JSON.parse(await blockexecute.readJobseeker(username))
        let usroriginalpassword = usrobj.password
        if (usroriginalpassword == password) {
            req.session.loggedin = true
            req.session.username = usrobj.jobseekerId
            res.redirect('/jobseeker/dashboard')
        } else {
            res.send("Invaild Credientials");
        }
    } catch (error){
        res.send("User Doesn't Exits");
    }
})
// Register a new job seeker to the portal
router.post('/createuser', async (req, res) => {
    try {
        await blockexecute.createjobseeker(JSON.stringify(req.body));
        console.log(req.body)
        res.send('Job Seeker Created Successfully. Back to <a href="/jobseeker/login">Login</a>');
    } catch (error) {
        res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
    }

})
// Dashboard for the job seeker
router.get('/dashboard', async (req, res) => {
    if (req.session.loggedin) {
        res.render('jobseeker/dashboard', { "usrdata": req.session.username })
    }
})
// Update a job seeker page
router.get('/editprofile/:ID', async (req, res) => {
    if (req.session.loggedin && req.session.username == req.params.ID) {
        try {

            let usrobj = JSON.parse(await blockexecute.readJobseeker(req.params.ID))
            res.render('jobseeker/update', { "data": usrobj })
        } catch (error){
            res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
        }
    } else {
        res.status(401).sendFile('401.html', { root: 'public/errorpages' }) // 401 - Unauthorized
    }
})
// This sends the updated record of job seeker to the blockchain
router.post('/update', async (req, res) => {
    if (req.session.loggedin && req.session.username == req.body.jobseekerId) {
        try {

            await blockexecute.updatejobseeker(JSON.stringify(req.body))
            res.send("<b>Details Sucessfully Updated <a href='/jobseeker/dashboard'>Back to Dashboard</a></b>")
        } catch (error){
            res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
        }
    } else {
        res.status(401).sendFile('401.html', { root: 'public/errorpages' }) // 401 - Unauthorized
    }
})
// Shows full profile of job seeker
router.get('/viewfullprofile/:ID', async (req, res) => {
    if (req.session.loggedin && req.session.username == req.params.ID) {
        try {

            let data = JSON.parse(await blockexecute.readJobseeker(req.params.ID))
            res.render('jobseeker/fullprofile', { "data": data });
        } catch (error){
            res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
        }
    } else {
        res.status(401).sendFile('401.html', { root: 'public/errorpages' }) // 401 - Unauthorized
    }
})
// Update password page for job seeker
router.get('/updatepassword', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile('/static/jobseeker/updatepassword.html', { root: '.' })
    } else {
        res.status(401).sendFile('401.html', { root: 'public/errorpages' }) // 401 - Unauthorized
    }
})
// Sends updated password to the blockchain
router.post('/updatepassword', async (req, res) => {
    let oldpasswd = req.body.oldpaswd;
    let newpasswd = req.body.newpaswd;
    let jobseekerId = req.session.username;
    oldpasswd = createHash('sha256').update(oldpasswd).digest('hex');
    let data = JSON.parse(await blockexecute.getjobseekerPassword(jobseekerId))
    let originalPassword = data.password;
    if (oldpasswd == originalPassword) {
        try {

            await blockexecute.updatejobseekerPassword(JSON.stringify({ "jobseekerId": jobseekerId, "newPassword": newpasswd }))
            res.send("<b>Password Sucessfully Updated</b>")
        } catch (error){
            res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
        }
    } else {
        res.send("<b>Old Password doesn't match</b>")
    }
})
// Job seeker can delete his profile
router.get('/deleteuser', async (req, res) => {
    try {
        await blockexecute.deleteJobSeeker(req.session.username, false);
        req.session.loggedin = false
        req.session.username = undefined
        res.send("User Deleted.<a href='/'>Back to Home</a>");
    } catch (error){
        res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
    }
})
// Job seeker searches for job
router.get('/searchjobs/', async (req, res) => {
    try {
        res.render('jobseeker/searchjob', { "data": JSON.parse(await blockexecute.queryAllJobposting()), "username": req.session.username });
    } catch (error) {
        res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
    }
})
// Job seeker apply for different jobs
router.get('/apply/:JPID', async (req, res) => {

    const jobseekerId = req.session.username;
    const jobpostingId = req.params.JPID;
    if (req.session.loggedin) {
        try {

            await blockexecute.applyforjob(JSON.stringify({ "jobseekerId": jobseekerId, "jobpostingId": jobpostingId }))
            res.send("You have sucessfully Applied. Thank You")
        } catch (error){
            res.status(500).sendFile('500.html', { root: 'public/errorpages' }) // 500 - Internal Server Error
        }
    } else {
        res.redirect("/jobseeker/login")
    }
})

export default router;