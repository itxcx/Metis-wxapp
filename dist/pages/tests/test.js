var config = require('../../config.js');
var common = require('../../common.js');
var util = require('../../utils/util.js');
Page({
    data: {
        showTopTips: false,
        error_msg: null,
        checked_value: null,
        test_id: null,
        step: 0,
        jwt: {},
        questions: []
    },
    onLoad: function(options) {
        var step = options.step || 0,
            test_id = options.test_id,
            that = this,
            jwt = {};
        if (!test_id) {
            that.showTopTips('测试不存在！')
        } else {
            that.setData({
                test_id: test_id
            })
        };
        try {
            var jwt = wx.getStorageSync('jwt')
            console.log(jwt);
            if (jwt) {
                that.setData({
                    jwt: jwt
                })
            }
        } catch (e) {
            common.login(that)
        }
        this.get_test_questions(test_id, step);
    },
    get_test_questions: function(test_id, step) {
        var that = this;
        common.request({ // 发送请求 获取 jwts
            url: '/v1/self/tests/' + test_id + '/questions',
            header: {
                Authorization: 'JWT' + ' ' + that.data.jwt.access_token
            },
            method: "GET",
            that: that,
            success: function(res) {
                if (res.statusCode === 200) {
                    that.setData({
                        questions: res.data,
                        question: res.data[step]
                    })
                    console.log(that.data)
                } else {
                    // 提示错误信息
                    wx.showToast({
                        title: res.data.text,
                        icon: 'success',
                        duration: 2000
                    });
                }
            }
        })
    },
    showTopTips: function(msg) {
        var that = this;
        this.setData({
            showTopTips: true,
            error_msg: msg
        });
        setTimeout(function() {
            that.setData({
                showTopTips: false
            });
        }, 3000);
    },
    submit: function() {
        var that = this;
        if (!that.checked_value) {
            that.showTopTips('请选择答案');
        } else {
            common.request({ // 发送请求 获取 jwt
                url: '/v1/tests/' + that.data.test_id + '/questions',
                header: {
                    Authorization: 'JWT' + ' ' + that.data.jwt.access_token
                },
                data: {
                    step: that.step,
                    value: that.checked_value
                },
                that: that,
                method: "POST",
                success: function(res) {
                    if (res.statusCode === 201) {
                        // 得到 jwt 后存储到 storage，
                        wx.showToast({
                            title: '登录成功',
                            icon: 'success'
                        });
                        wx.setStorage({
                            key: "jwt",
                            data: res.data
                        });
                        that.globalData.access_token = res.data.access_token;
                        that.globalData.account_id = res.data.sub;
                    } else if (res.statusCode === 401) {
                        // 如果没有注册调用注册接口
                        that.register();
                    } else {
                        // 提示错误信息
                        wx.showToast({
                            title: res.data.error_code,
                            icon: 'success',
                            duration: 2000
                        });
                    }
                }
            })
        }
    },
    radioChange: function(e) {
        var that = this;
        console.log('radio发生change事件，携带value值为：', e.detail.value);

        var question = this.data.question;
        var options = question.options;
        for (var i = 0, len = options.length; i < len; ++i) {
            options[i].checked = i == e.detail.value;
        }
        that.checked_value = e.detail.value;
        question['options'] = options
        this.setData({
            question: question
        });
    },
});