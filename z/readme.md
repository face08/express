入口文件 index.js
测试demo example/web-server

### 参考
* https://zhuanlan.zhihu.com/p/56947560
* https://cnodejs.org/topic/5746cdcf991011691ef17b88
* https://segmentfault.com/a/1190000011049112


### Router 和 Route
Route模块对应的是route.js，主要是来处理路由信息的，每条路由都会生成一个Route实例。
而Router模块对应的是index.js，Router是一个路由的集合，在Router模块下可以定义多个路由，
也就是说，一个Router模块会包含多个Route模块。通过上边的代码我们已经知道，
每个express创建的实例都会懒加载一个_router来进行路由处理，这个_router就是一个Router模块。

### layer
每一个Layer对应一个中间件函数，Layer存储了每个路由的path和handle等信息，
并且实现了match和handle的功能。而从前边我们已经知道，每个Route都会维护一个Layer数组，
可以发现Route和Layer是一对多的关系，每个Route代表一个路由，而每个Layer对应的是路由的每一个中间件函数。


### 流程
当客户端发送一个http请求后，会先进入express实例对象对应的router.handle函数中，
router.handle函数会通过next()遍历stack中的每一个layer进行match，如果match返回true，
则获取layer.route，执行route.dispatch函数，route.dispatch同样是通过next()遍历stack中的每一个layer，
然后执行layer.handle_request，也就是调用中间件函数。直到所有的中间件函数被执行完毕，整个路由处理结束




### 路由 req.app._router.stack
```javascript

// 根路径的get、post、put、delete
app.get('/', function (req, res) {
    res.send('Hello World!2');
});
app.post('/', function (req, res) {
    res.send('Got a POST request');
});


app.route('/book')
    .get(function (req, res) {
        res.send('Get a random book');
    })
    .post(function (req, res) {
        res.send('Add a book');
    })
    .put(function (req, res) {
        res.send('Update the book');
    });
```
```js
Layer{path:"/",method:"get",fu}
Layer{path:"/",method:"get",fu}
Layer{path:"/book"
        route:stack:[
            Layer{ method:"get",fu},
            Layer{ method:"post",fu},
            Layer{ method:"put",fu}
          ]
        }
```
