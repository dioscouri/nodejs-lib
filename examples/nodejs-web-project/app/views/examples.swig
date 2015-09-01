<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>{{ header }} - Examples</title>

</head>

<body>

    <form id="frmPostExample" method="post" action="/examples/post-example">
        <div style="margin: 40px;">
            <input type="text" name="username" value="Eugene A. Kalosha" />
            <input type="hidden" name="pageId" value="1234-abc8-3847-8349" />
        </div>
    </form>

    <div style="margin: 40px;">
        <a href="javascript:void(0);" onclick="document.getElementById('frmPostExample').submit()">[Run Post Example]</a> <br />
        <a href="/examples/authorization-failed">[Run Authorization Failed Example]</a> <br />
        <a href="/examples/authorization-failed-redirect">[Run Authorization Redirect Example]</a> <br />
        <a href="/examples/initialize-db">[Initialize DB]</a> <br />
        <a href="/examples/get-info">[Get Items]</a> <br />
        <a href="/examples/send-to-queue">[Start Job]</a> <br />
    </div>

    <div style="margin: 40px;">
        {% for user in users %}
            {{ user.id }} &lt; {{ user.email }} &gt; <br />
        {% endfor %}
    </div>

    {% if allowed !== undefined %}
        <strong>
            {% if allowed %}
                This User is allowed to read users
            {% else %}
                This User is not allowed to read users
            {% endif %}
        </strong>
    {% endif %}
</body>
</html>
