
var path = require('path');
var circular_json = require('circular-json');
var _ = require('underscore');
var fs = require('fs');
var title_array = [],
    output,
    book_title

module.exports = {
    hooks: {
        "init": function(){
            output = this.config.values.output
            for(key in this.navigation) {
                this.navigation[ key ].title = 12345;
            }
            book_title = this.config.values.title
            //console.log('book_title' + book_title)
            //console.log(circular_json.stringify(this, null, 4))

        },
        "page:before": function (page) {
            title_array.push({
                level: page.level,
                title: page.title,
                basename:  page.path.substring(0, page.path.lastIndexOf('.') )
            });
            return page;
        },
        "finish": function(){ //tcp空格不行
            //console.log('output: '+ output)
            //console.log(JSON.stringify(title_array, null, 4))
            _.each(title_array, element => {
                Promise.resolve()
                    .then( () => { //查找html
                        if (element.basename !== 'README') {
                             element.file_path = path.join(output,'index' + ".html")
                        }else {
                             element.file_path = path.join(output,'index' + ".html")
                        }
                        return element
                    })
                    .then( element => { //读取内容
                        return new Promise( resolve => {
                            fs.readFile( element.file_path, (err, data) => {
                                if (err) throw err

                                element.content = new String(data)
                                
                                resolve( element )
                            })
                        })
                        
                    })
                    .then( element => { //获取新title
                        //console.log(arguments)
                        let title = (( element.content ).match(new RegExp("<title>(.+)· " + book_title  )  ) )[1].slice(0, -1), //去掉最后匹配多出来的空格
                            title_object = _.find(title_array, function(element){
                                                if (element.title === title) return true
                                            }),
                            level = title_object.level
                        
                        while(true){
                            level = level.substring(0, level.lastIndexOf('.'))
                            title_object = _.find(title_array, function(element){
                                        if (element.level === level) return true
                                    })

                            if ( !title_object ) break;

                            title +=  ' ' +  title_object.title
                        }

                        element.new_title  = "BoyaaIDE 用户手册"
                        return element
                    })
                    .then ( element => { //设置新title
                         element.content = element.content.replace(/<title>(.+)<\/title>/,function(match, p1){
                            return '<title>' + element.new_title + ' · ' + book_title + '</title>'
                        })
                         return element
                    })
                    .then( element => { //新title都到文件中 
                       fs.writeFileSync(element.file_path,  element.content)
                    } )
                    .catch(err => {
                        console.log(element)
                        console.log(err)
                    })
            }
        }
    }
};


