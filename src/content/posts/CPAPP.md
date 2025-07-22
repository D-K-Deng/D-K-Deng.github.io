---

title: Cerebral Palsy APP Design
published: 2022-12-18
description: 'A personalized app designed for caregivers of children with cerebral palsy that boosts motivation through customized training plans, progress-tracking visualizations, and a reward system to support after-class rehabilitation.'
image: '../../assets/images/cp.png'
tags: [Html]
category: 'Projects'
draft: false 
seriesCategory: "Projects"
seriesCategoryDescription: "My Projects"
series: "Computation and Design"
seriesDescription: “Explorations at the intersection of computational methods and design practice”

---
::github{repo="D-K-Deng/CP_Children_Monitoring_APP"}

This project is a **short demo** of how can we design a suitable APP for CP's children's parents. According to user study and background research, most of parents now lack of motivations and persistence to monitor and encourage their CP children to do after-class training. After chating and discussing with profession recovery teachers for CP children, an great idea was implemented and designed.

<iframe width="100%" height="468" src="https://www.youtube.com/embed/7-C-XKz-w9Y" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>


- ---

# <a id="_Hlk121577055"></a>APP Based on After\-school Mechanism for Cerebral Palsy Caregivers

## Abstract

Based on the situation that many caregivers of cerebral palsy \(CP\) children have lost motivation to supervise their children’s rehabilitation training at home, the project mainly focuses on invoking caregivers’ intrinsic motivation\. This project first interviewed Aijia \(A CP children recovery center\) teachers to ask why caregivers lost intrinsic motivation\. Then made a pre\-questionnaire among some potential users to check the necessity of design direction\. The project also utilized questionnaires in the product to detect caregivers’ preferences\. Besides, it determined future tasks based on the children’s past performance\. Finally, data visualization was applied for caregivers to see children’s progress directly through training data\. There are two mechanisms designed for the app\. The first design is the reward mechanism, meaning users can see their children’s improvement through additional yellow stars\. The second design is the matching mechanism\. It matches potential users with specific training tasks based on their age group, time spent on children, and children’s symptoms and current ability from the questionnaire\. In a nutshell, the product is an app based on an after\-class training mechanism that includes the function of personalization and data visualization to improve caregivers’ intrinsic motivation\. From the parents’ perspective, this product will help children improve their training efficiency at home and let them recover faster\.

## Keywords

Sense of achievement, motivation, customized plan\-making, data visualization

## Introduction

CP children’s rehabilitation training at home is as essential as their training at school\. Without surveillance from teachers, caregivers are considered the most important persons to supervise children doing training after school\. However, according to Aijia teachers, although many caregivers of CP children have some spare time, they do not take enough responsibility to supervise their children\. According to Fishman and Nickerson \(2014\), compared with the caregivers of students in traditional education, the caregivers of students in special education have more obstacles to caregivers’ participation\. From the interview with Aijia teachers, the main reason is that caregivers feel frustrated as they cannot see their children’s progress and lose their sense of achievement\. Motivation is closely connected with a sense of achievement\. The higher the sense of achievement is, the more motivated people will be\. Therefore, the targeted users are caregivers of CP children who lack the motivation to supervise their children to do training\. The design focus is to find ways to improve caregivers’ sense of achievement so that they can be more involved in children’s curing process\. Nowadays, few research and products are focusing on this field\. Teachers in Aijia mainly use WeChat to connect with caregivers\. However, WeChat can only satisfy basic communication needs and cannot solve caregivers’ lack of motivation\. To improve caregivers’ motivation, the following things need to be done\. First, providing a questionnaire for caregivers in the app to know their basic situation, and individualized training tasks for CP children will be given\. Besides, instructions for caregivers will be offered simultaneously\. Second, allowing caregivers to use picture uploading or manual input to upload children’s data based on caregivers’ preferences\. Finally, bar and line charts will be shown according to the data recorded so that caregivers can clearly understand how their children behave in the curing process\. 

## Method 

This project utilize interview and user study methods during our design process to finish the design\. To apply the mechanism, a questionnaire and data visualization are designed\. The project apply the mechanism and core features to CP caregivers through the APP framework\.

<a id="_Hlk121429813"></a>__Interview__

When designing, I first interviewed the teacher in Aijia\. According to the teacher, the design for CP children’s recovery process is hard to improve since the steps are now well\-developed\. However, one thing I can do is to extend the training process to after\-class time\. The teacher mentioned that caregivers always lack helping their children’s training after class and talked about caregivers not having enough motivation to supervise their children’s rehabilitation training process since it is hard to see their progress\. 

__User study methods__

I had a pre\-questionnaire to see whether it was acceptable to choose after\-class recovery as our focus direction\. The result shows that caregivers usually have free time but seldom use them to help with CP children’s treatments after class\. 

__Core features__

*Questionnaire*

![](/image/11.png)
![](/image/22.png)


<center>Figure 1</center>

Customized questionnaires help provide different goals based on user’s needs, allowing caregivers to help their children recover efficiently\. As figure 1 shows, I hope to classify the caregivers through the questionnaire according to their cognitive levels and devotion time\. The cognitive level decides the difficulty of training content, while the activeness decides the amount of training\. Most importantly, I will correlate different symptoms and current abilities of children with training content\. I want to push the training content by the child’s symptoms and consider the child’s current ability\. I modify the training content and volume if the child has the appropriate ability\. 

*Data visualization*

![](/image/33.png)
![](/image/44.png)

<center>Figure 2</center>

Data visualization helps revoke caregivers’ sense of achievement and intrinsic motivation\. Line charts and bar charts present how much their children have improved \(as shown in figure 2\)\. I also make an appropriate plan based on their previous commitment to the past training volume\. Suppose there has been a significant improvement in the previous period\. In that case, I gradually increase the training and eventually reach a suitable level\.

![](/image/55.png)
![](/image/66.png)

<center>Figure 3</center>

Meanwhile, I created a reward system that involves stars \(figure 3\) to give positive psychological cues to caregivers\.

![](/image/77.png)

<center>Figure 4</center>

I rate the number of stars based on the database \(as shown in figure 4\)\. If the training amount reaches the target range, then will give them corresponding stars\.

*APP framework*

The core feature customizes users’ plans according to their conditions to motivate caregivers\. Therefore, a training mechanism is conducted to support the core feature\. 

![](/image/88.png)

<center>Figure 5</center>

Through figure 5, I provide a flowchart to show the iterative mechanism that the app is utilizing\. The first step is about the questionnaire, which collects basic info like age group, available time, and symptoms\. Then, the app generates a few training tasks and provides a detailed tutorial\. Also, users are required to input their children’s current condition at this stage\. Afterward, the app provides a personalized plan for users\. At last, the app will present ways to check in every day and data visualization\. All the questions in this app are easy to understand to increase accessibility\. What is more, data visualization is available for each training task\. Users can renew or update their children’s latest conditions when needed\.

## Community Engagement

During the design process, I had two in\-person visits \(one followed the class and others went by ourselves\) and one online meeting in total\. During the first in\-person visit, I learned how Aijia teachers worked to help CP children recover\. Afterward, I conducted semi\-structured interviews with the Aijia teachers during the online meeting and second in\-person visits to ask them for suggestions\. In the online meeting, Aijia teachers told me that the most challenging problem they needed to solve was caregivers’ lack of motivation to supervise their CP children at home\. They also told me the main reason was that caregivers could not see their children’s evident progress and lost a sense of achievement\. Based on this online meeting, I eventually confirmed that the design focus was to find ways to improve caregivers’ sense of achievement\. I took the initial design to Aijia teachers during the second in\-person visit to seek advice\. Aijia’s teachers gave me valuable suggestions on two aspects\. First, the teacher suggested dividing users into different groups when recording data\. Young users are recommended to use photo uploading, and elderly users had better use manual input\. Second, the teacher pointed out that the APP should use straightforward language to express children’s symptoms concerning the symptom design in the questionnaire\.

## The Final Design/Solution 

The product is an app that will measure children’s improvement\. It mainly has four steps when users use this app\. 

![](/image/99.png)
![](/image/10.png)
![](/image/111.png)

<center>Figure 6</center>

First, users must fill out a questionnaire \(as shown in figure 6\) about their age groups, their free time, and their children’s symptoms\. According to the questionnaire’s results, I set the total training time according to the actual situation and confirmed targeted training tasks\.

![](/image/112.png)
![](/image/113.png)

<center>Figure 7</center>

After this, the APP provide instructions for movements to inform caregivers about the standards\. During this process, it also collect the current condition of users’ children’s performances \(as shown in figure 7\)\. 

![](/image/114.png)
![](/image/115.png)

<center>Figure 8</center>

Using these data, the app generates a suitable plan for caregivers\. The current condition is shown through grey stars, and the improvement is shown as yellow stars \(as shown in figure 8\)\. 

![](/image/116.png)
![](/image/117.png)

<center>Figure 9</center>

Then, to collect the data, it have two ways to input the data \(as shown in figure 9\)\. First, young adults can use image recognition by shooting videos during training or letting their kids wear smartwatches to record the movement data\. Through identifying points from images or watch sensors, it collects information like the steps the kids walked, the repeated times of head movement, and the accurate rate of training postures\. For older people, it also have a manual list for them to check and record on the app\. 

![](/image/118.png)

<center>Figure 10</center>

Last, with a period’s data collection, the app visualizes them into line charts and bar charts for caregivers \(as shown in figure 10\) to see how much their children have improved compared to how they behaved before\.

## Evaluations and Reflections

The two significant design features designed were personalized training content and data feedback\. The core advantage of our product is that there is no app specifically designed to eliminate the discontinuity of school and after\-school training\.  

__Personalization__

The APP will push the related training content to the target group through the classification mechanism described earlier\. Through early market research, it is found that an important reason for parents’ general loss of inner motivation is that the training content is too complicated, and it is difficult to remember the essentials of the movement\. By pushing the training details and breaking down the action, it is hope to reduce the extra effort caregivers need to master the action\. The child’s symptoms may be too complex, so there may still be a gap between the symptoms and the child’s training content\. 

__Data statistics and feedback features__

As for the data feedback function, the most significant advantage of our product is that it can make a horizontal comparison between the amount of training in the past and present timeline\. By comparison, The ultimate goal is to let caregivers feel their achievements in the past period\. Meanwhile, the APP created a reward system involving stars to give caregivers positive psychological cues\. For caregivers, the symbolic meaning of the star represents the affirmation of others, and this behavior can lead to a positive psychological suggestion of self\.

The APP divides data input into automatic and manual input\. Although it can use automatic data input, focusing more on the manual input option is better because it helps build personal responsibility\. The significant difference between our app and WeChat is data processing\. The app does not require the teacher to push the future training amount according to CP children’s current condition but can automatically push the amount directly through the feedback logic\.