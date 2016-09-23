var request = require('request')
var http = require('http')
var cheerio = require('cheerio')
var fs = require('fs')
var xlsx = require('node-xlsx')
var dataArray = []
var mysql = require('mysql')

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'lagou',
    port: 3306
});
conn.connect(function(error, results) {
  if(error) {
    console.log('Connection Error: ' + error.message);
    return;
  }
  console.log('Connected to MySQL');
});
var ckb = 0;
function filter(id){
  var url = 'http://www.lagou.com/jobs/' + id + '.html'
  http.get(url, function(res){
    var html = ''

    res.on('data', function(data){
      html += data    //请求到的html数据
    })

    res.on('end', function(){
      var $ = cheerio.load(html)
      var job = $('.join_tc_icon h1').attr('title')
      var salary = $('.job_request .red').text()
      var job_company = $('title').text().split('招聘-拉勾网')[0]
      var company = job_company.split('招聘-')[1]
      var job_addr = $('#smallmap').prev().text()
      var publish_time = $('.publish_time').text().split('发布于拉勾网')[0]
      //console.log(url + '  ' + '【' + job + '】 ' + salary + '  ' + company + '  ' + job_addr + '  ' + publish_time)
      // var datas = [job, salary, company, job_addr, publish_time, url]
      var oneJob =  url + '  ' + '【' + job + '】 ' + salary + '  ' + company + '  ' + job_addr + '  ' + publish_time
      dataArray.push(oneJob)
      // var obj = {worksheets:[
      //   // {"data": datas}
      //   {"data": [["索引1","索引2","c"]]}
      // ]}
      // var file = xlsx.build(obj)
      // fs.writeFileSync("b.xlsx", file, "binary")
      var insertSQL = 'INSERT INTO job(jobName,salary,company,jobAddr,pubTime,url) VALUES(?,?,?,?,?,?)'
      var jobParams = [job, salary, company, job_addr, publish_time, url]
      console.log(ckb + 1);
      conn.query(insertSQL, jobParams, function(err, result){
        if(err){
         console.log('[INSERT ERROR] - ',err.message);
         return;
        } 
        console.log('-------INSERT----------');
        //console.log('INSERT ID:',result.insertId);       
        console.log('INSERT ID:',result);       
        console.log('#######################');  
      })

    })
    // return job_company
  }).on('error', function(){
    console.log('获取网页数据失败！')
  })
}

for(var j=2; j<10; j++){
  var post_data = 'first=false&pn='+j+'&kd=.NET'
  var options = {
    method: 'POST',
    url: 'http://www.lagou.com/jobs/positionAjax.json?px=new&city=%E6%9D%AD%E5%B7%9E',
    form: post_data,
    header: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Content-Length": post_data.length,
      "Referer": "http://www.lagou.com/jobs/list_%E5%AE%A2%E6%9C%8D?px=new&city=%E6%9D%AD%E5%B7%9E"
    }
  }

  var post_req = request(options, function(error, res, body){
    if(error) throw new Error(error)
    var body = JSON.parse(body)
    var result = body.content.result   //请求到的json数据
    //console.log(result[14].positionId)

    for(var i=0; i<result.length; i++){
      //console.log('公司：' + result[i].companyName + ' 职位：' + result[i].positionName + ' 地址：')
      filter(result[i].positionId)
      //console.log(dataArray)
    }

    // fs.writeFile('a.txt', dataArray, function(err){
    //   if (err) {
    //     return console.error(err);
    //   }
    // })
    
  })
}


//post_req.write(post_data);