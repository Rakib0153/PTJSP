var express = require('express');
var router = express.Router();
const blockexecute = require('../blockchainExecuter')
//login for HR
router.get('/login', async (req, res) => {
    res.sendFile('/static/hr/login.html', { root: '.' })
})
// HR credientials verification
router.post('/login/verfify', async (req, res) => {
    let username = req.body.username
    let password = req.body.password

    if ((username == 'HR1' ||
        username == 'HR2' ||
        username == 'HR3' ||
        username == 'HR4')
        && password == '1234') {
        req.session.username = username
        req.session.loggedin = true
        req.session.usertype = 'hr'
        res.redirect('/hr/dashboard')
    } else {
        res.send("Invaild Credientials")
    }
})
// Dashboard for HR
router.get('/dashboard', (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        res.sendFile('/static/hr/dashboard.html', { root: '.' })
    } else {
        res.send("Login Required")
    }

})
// Job posting page
router.get('/jobpost', (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        res.sendFile('/static/hr/jobpost.html', { root: '.' })
    } else {
        res.send("Login Required")
    }
})
// This sends the new Job post record to Blockchain
router.post('/jobpost', async (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        try {
            let data = req.body;
            data.HRId = req.session.username;
            await blockexecute.createJobposting(req.body);
            res.send("Job Posted Successfully");
        } catch (error) {
            res.sendStatus(501);
        }
    } else {
        res.send("Login Required")
    }

})
// HR can view his own posted jobs
router.get('/viewposts', async (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        try {
            let data = JSON.parse(await blockexecute.queryJobPostingByHRId(req.session.username));
            res.render('hr/postedjobs', { "data": data })
        } catch (error) {
            res.sendStatus(404);
        }

    } else {
        res.send("Login Required")
    }
})
// HR can delete a job posted by him/her
router.get('/deletejob/:jobpostingId', async (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        try {
            await blockexecute.deleteJobposting(req.params.jobpostingId, false)
            res.redirect("/hr/viewposts");
        } catch (error) {
            res.sendStatus(501);
        }
    } else {
        res.send("Login Required")
    }

})
// HR can view the details of a candidate , only if the candidate applied for the job
router.get('/candidate/:jobpostingId/:jobseekerId', async (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        try {
            let data = JSON.parse(await blockexecute.readJobseekerbyHR(req.params.jobseekerId, req.params.jobpostingId, req.session.username));
            res.render('hr/candidateprofile', { "data": data, "jobpostingId": req.params.jobpostingId })

        } catch (error) {
            res.sendStatus(501);
        }
    } else {
        res.send("Login Required")
    }
})
// HR can mark one candidate as hired
router.get('/hired/:jobpostingId/:jobseekerId/', async (req, res) => {
    if (req.session.loggedin && req.session.usertype == 'hr') {
        try {
            const jobseekerId = req.params.jobseekerId;
            const jobpostingId = req.params.jobpostingId;
            await blockexecute.updateStatus(jobseekerId, jobpostingId)
            res.send("<b>Candidate Hired Successfully</b>");
        } catch (error) {
            res.sendStatus(501);
        }
    } else {
        res.send("Login Required")
    }
})

module.exports = router;