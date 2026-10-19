import requests
import time as time_module
from datetime import datetime, time


def retry_request(url, method="GET", max_retries=5, retry_delay=2, **kwargs):
    """
    封装的重试请求函数
    :param url: 请求的URL
    :param method: 请求方法（GET/POST等，默认为GET）
    :param max_retries: 最大重试次数
    :param retry_delay: 重试间隔时间（秒）
    :param kwargs: 其他传递给requests的参数（如headers、data等）
    :return: 请求成功时返回响应对象，失败时返回None
    """
    for attempt in range(max_retries):
        try:
            if method.upper() == "GET":
                response = requests.get(url, **kwargs)
            elif method.upper() == "POST":
                response = requests.post(url, **kwargs)
            else:
                print(f"不支持的请求方法：{method}")
                return None

            response.raise_for_status()  # 检查HTTP请求是否成功
            return response  # 请求成功，返回响应对象
        except requests.exceptions.RequestException as e:
            print(f"第 {attempt + 1} 次请求失败，错误：{e}")

        # 如果请求失败，等待一段时间后重试
        if attempt < max_retries - 1:
            print(f"等待 {retry_delay} 秒后重试...")
            time_module.sleep(retry_delay)

    # 如果所有重试都失败，返回 None
    print("请求失败，已达到最大重试次数。")
    return None


def get_USDCNH():  # 离岸美元人民币
    """
    离岸美元人民币日涨幅
    """
    url = "https://push2.eastmoney.com/api/qt/stock/get"

    # 请求参数
    params = {
        "invt": "2",
        "fltt": "1",
        "cb": "",
        "fields": "f58,f107,f57,f43,f59,f169,f170,f152,f46,f60,f19,f532,f39,f44,f45,f119,f120,f121,f122",
        "secid": "133.USDCNH",
        "ut": "fa5fd1943c7b386f172d6893dbfba10b",
        "wbp2u": "|0|0|0|web",
        "dect": "1",
        "_": "1729180093091",
    }

    # 发送GET请求
    response = retry_request(url=url, params=params)
    # print(response.json())
    return round(response.json()["data"]["f43"] / 10000, 4)


def get_HSTECH():
    """ """
    url = "https://push2.eastmoney.com/api/qt/stock/get"
    params = {
        "invt": "2",
        "fltt": "1",
        "cb": "",
        "fields": "f58,f107,f57,f43,f59,f169,f170,f152,f46,f60,f44,f45,f171,f47,f86,f292",
        "secid": "124.HSTECH",
        "ut": "fa5fd1943c7b386f172d6893dbfba10b",
        "wbp2u": "|0|0|0|web",
        "dect": "1",
        "_": "1729184310153",
    }

    response = retry_request(url=url, params=params)
    # 判断是否是数字
    # print(response.json())
    is_number = isinstance(response.json()["data"]["f170"], (int, float))
    if is_number:
        return round(response.json()["data"]["f170"] / 100, 4)
    else:
        return 0


def _get_realtime_stock_price_radio_vol(secid: str):
    """
    secid 为东财接口id，目前已知
    沪深300:  1.000300
    全A股:  47.800000
    创业板:  0.399006
    返回最新价，涨跌幅，成交量，单位万亿
    """
    url = "https://push2his.eastmoney.com/api/qt/stock/kline/get"
    params = {
        "secid": secid,
        "ut": "fa5fd1943c7b386f172d6893dbfba10b",
        "fields1": "f1,f2,f3,f4,f5,f6",
        "fields2": "f51,f53,f57,f59",
        "klt": "101",
        "fqt": "1",
        "beg": "0",
        "end": "20500101",
        "smplmt": "460",
        "lmt": "1000000",
    }

    response = retry_request(url=url, params=params)

    # print(response.json())
    if response.status_code == 200:
        data_list = response.json().get("data").get("klines")
        (
            ratime,
            price,
            vol,
            radio,
        ) = data_list[
            -1
        ].split(",")

        return float(price), float(radio), round(float(vol) / 1000000000000, 2)
    else:
        print("Failed to retrieve data:", response.status_code)
        return None


def _get_hs300_qh():
    """
    返回json
    """
    # 目标 URL
    base_url = "https://api.jijinhao.com/sQuoteCenter/realTime.htm?code=JO_338503"
    # 自定义的 HTTP 头部信息
    headers = {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "referer": "https://m.quheqihuo.com/",
        "sec-ch-ua": '"Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "script",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "cross-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0",
    }

    # 获取当前的 Unix 时间戳
    timestamp = str(int(time_module.time() * 1000))

    # 构建完整的 URL
    url = f"{base_url}&_={timestamp}"

    # 发送 GET 请求
    response = retry_request(url=url, headers=headers)
    response.raise_for_status()
    # hq_str = "沪深加权,0,3541.6,3833.0,3895.2,3606.2,0,0,349796.0,3.90904119E11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2024-09-27,14:59:59,00,1,291.3999,8.227917,0.0,0.0,3648.6,120,2024-09-27,14:59:59,"
    response.text
    # 移除字符串中的 'var hq_str = ' 和最后的逗号
    hq_str = response.text.replace("var hq_str = ", "").rstrip(",")

    # 将字符串分割成列表
    str_array = hq_str.split(",")

    # 初始化一个字典来存储数据
    CurrentHqData = {}

    # 将字符串转换为浮点数并存储到字典中

    CurrentHqData["price"] = float(str_array[3])
    CurrentHqData["date"] = str_array[40]
    CurrentHqData["time"] = str_array[41]

    return CurrentHqData["price"]


def get_hs300_baise():
    hs300_price, hs300_updown, _ = _get_realtime_stock_price_radio_vol("1.000300")

    return round(hs300_price - _get_hs300_qh(), 2)


def get_hs300_price_with_vol():
    hs300_price, hs300_updown, vol = _get_realtime_stock_price_radio_vol("1.000300")
    return round(hs300_price, 2), vol


def get_cyb_price_with_vol():
    cyb_price, cyb_updown, vol = _get_realtime_stock_price_radio_vol("0.399006")
    return round(cyb_price, 2), vol


def get_CN10_ratio():
    # 171.CN10Y
    return _get_realtime_stock_price_radio_vol("1.511260")[1]


def get_all_vol():
    return _get_realtime_stock_price_radio_vol("47.800000")[2]


def _stock_get_hs300():
    url = "https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=SECURITY_CODE&sortTypes=-1&pageSize=300&pageNumber=1&reportName=RPT_INDEX_TS_COMPONENT&columns=SECUCODE%2CSECURITY_CODE%2CSECURITY_NAME_ABBR&quoteColumns=f2%2Cf3&quoteType=0&filter=(TYPE%3D%221%22)"
    # 发送GET请求
    response = retry_request(url=url)

    data = response.json()["result"]["data"]

    # 将数据转换为需要的格式
    formatted_data = []
    for item in data:
        formatted_data.append(
            {
                "代码": item["SECURITY_CODE"],
                "代码(简)": item["SECUCODE"],
                "名称": item["SECURITY_NAME_ABBR"],
                "最新价": (
                    float(item["f2"])
                    if item["f2"] is not None and not isinstance(item["f2"], str)
                    else None
                ),
                "涨跌幅": (
                    float(item["f3"])
                    if item["f3"] is not None and not isinstance(item["f3"], str)
                    else None
                ),
            }
        )

    return formatted_data


def sum_hs300():
    data = _stock_get_hs300()

    bins = [-float("inf"), -5, 0, 5, float("inf")]
    labels = ["t5d", "d50", "u05", "t5u"]

    grouped_data = {label: 0 for label in labels}

    total_rise = 0
    total_fall = 0

    for item in data:
        if item["涨跌幅"] is None:
            continue

        if item["涨跌幅"] > 0:
            total_rise += 1
        elif item["涨跌幅"] < 0:
            total_fall += 1

        for i in range(len(bins) - 1):
            if bins[i] <= item["涨跌幅"] < bins[i + 1]:
                grouped_data[labels[i]] += 1

    result = {**grouped_data, "tdn": total_fall, "tup": total_rise}

    return result


# 示例用法
# print(sum_hs300())

if __name__ == "__main__":
    print(get_hs300_baise())
    print(get_USDCNH())
    print(get_HSTECH())
    print(get_all_vol())
    print(sum_hs300())
    print(get_CN10_ratio())
