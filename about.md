---
layout: page
title: About
---

<div class="split-image-text">
    <img src="{{ "/assets/img/profile-picture-2018.06.23.jpg" | relative_url }}" alt="Profile picture" class="img profile-picture" />

    <p>
    Hey there! This page will tell you about me, and therefore also act like a CV/resume.

    I'm Swiss and currently studying <a href="https://www.fhnw.ch/en/degree-programmes/business/bsc-in-business-information-technology">Business IT</a> at the <a href="https://www.fhnw.ch/en">Fachhochschule Nordwestschweiz</a>.
    </p>
</div>

- toc
{: toc }

## Timeline

{% assign steps = site.steps | sort: 'date' | reverse %}
{% for step in steps %}

<div class="item">
    <i class="vertical-line"></i>
    <h2 class="item-date">{{ step.date | date: '%m/%Y' }}{% if step.enddate %} - {{ step.enddate | date: '%m/%Y' }}{% endif %}</h2>
    <div class="card-panel">
        <h3 class="card-title">
            {{ step.title }}
        </h3>
        <p>
            {{ step.content }}
        </p>
    </div>
</div>
{% endfor %}
<div class="last-item">
    <i class="vertical-line"></i>
</div>
<br>
<br>

## Hobbies

* Programming
* Hang out with friends
* ANIME (Watch TV)

## Qualifications

Basic: 🌟
Standard: 🌟🌟
Good: 🌟🌟🌟
Expert: 🌟🌟🌟🌟

| Lanugage | Verbal   | Written  | Info/Certificate |
| -------- | -------- | -------- | ---------------- |
| Spanish  | 🌟🌟🌟   | 🌟      |                  |
| German   | 🌟🌟🌟🌟 | 🌟🌟🌟🌟 | Native language  |
| French   | 🌟🌟     | 🌟🌟     | 📜 DELF B1       |
| English  | 🌟🌟🌟   | 🌟🌟🌟   | 📜 CAE C1        |
| Italian  | 🌟       | 🌟       |                  |

I will hand out the certificates on request. Please contact me over [email](mailto:{{ site.author.email }})

| Programs             | Knowledge |
| -------------------- | --------- |
| Microsoft Word       | 🌟🌟🌟🌟  |
| Microsoft Excel      | 🌟🌟🌟🌟  |
| Microsoft PowerPoint | 🌟🌟🌟🌟  |
| Nexus Hospis         | 🌟🌟🌟    |
| JetBrains PhpStorm   | 🌟🌟🌟🌟  |
| JetBrains IntelliJ   | 🌟🌟🌟    |
| Microsoft VS Code    | 🌟🌟      |

| Operating System | Knowledge |
| ---------------- | --------- |
| Ubuntu           | 🌟🌟      |
| Windows          | 🌟🌟🌟    |

| Databases | Knowledge |
| --------- | --------- |
| MySQL     | 🌟🌟🌟    |

| Programming languages | Knowledge |
| --------------------- | --------- |
| HTML                  | 🌟🌟🌟🌟  |
| CSS                   | 🌟🌟      |
| JavaScript            | 🌟🌟      |
| PHP (& OOP)           | 🌟🌟🌟🌟  |
| Twig                  | 🌟🌟🌟🌟  |
| SQL                   | 🌟🌟      |
| Java                  | 🌟🌟      |

| Version Source Control | Knowledge |
| ---------------------- | --------- |
| Git                    | 🌟🌟🌟    |

| Other                    |                          |
| ------------------------ | ------------------------ |
| Requirements Engineering | 📜 IREB Foundation Level |
| SAP S/4HANA (TS410) ERP  | 📜 erp4students          |

For the current list or software projects, please refer to my [Github page]({{ site.author.github }}?tab=repositories)

## Other profiles

* [LinkedIn](https://www.linkedin.com/in/d3strukt0r/)
* [Xing](https://www.xing.com/profile/Manuele_xx/cv)
* [Github](https://github.com/D3strukt0r)

Thanks for reading!
