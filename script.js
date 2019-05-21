const log = (type, data) => {
    let today = new Date()
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    console.log(`[${date} ${time}][${type.toUpperCase()}] ${data}`)
}

const processPost = postEl => {
    return new Promise((resolve, reject) => {
        log('POST', postEl.id)
        postEl.style['border'] = '3px solid black'
        let post = {}
        post.id = postEl.id
        setTimeout(()=>{
            postEl.remove()
            resolve(post)
        },10)
    })
}

const processPosts = async () => {
    let postsElements =  [...document.body.getElementsByClassName('mbm')]
    for (postEl of postsElements) {
        let post = await processPost(postEl)
    }
}

const isNewFeed = () => {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            window.scrollBy(0, -100)
            setTimeout(() => {
                window.scrollBy(0, 100)
            },100)
            setTimeout(() => {
                let posts = [...document.body.getElementsByClassName('mbm')]
                if (posts.length > 0) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            },500) 
        }, 400)
    })
}

const waitForNewFeed = async () => {
    let waiting = true
    let counter = 1
    while (waiting) {
        log('LOADING FEED', `${counter}s`)
        waiting = !(await isNewFeed())
        counter ++
    }
}

const processPage = async () => {
    for(let i=0; i<50; i++) {
        await processPosts()
        await waitForNewFeed()
    }
}

processPage()






const writeToFile = (type, data) => {
    let a = document.createElement('a')
    a.href = "data:application/octet-stream,"+encodeURIComponent(data)
    a.download = `${type}.csv`
    a.click()
    a.remove()
}

