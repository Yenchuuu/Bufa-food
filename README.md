# BUFA FOOD

### Description

Aim to solve the problem which people usually don’t know what to eat, how to eat healthy and  have a balanced diet in daily basis. Now people can easily get nutritious meal plans recommended by BUFA FOOD once setting up the body goal and information.

### Website

<a href="https://bufafood.click/" target="_blank">BUDA FOOD</a>

- Recommend screen width: 1470px

- Test account **(Please login the test account to access the user-only function, such as meal diary and food recommendation.
)**

    > Account: bufafood@test.com  
    Password: test1234


### Features

- [x] Record daily meals.
- [x] Recommend customized healthy meal plans.
- [x] Weekly statistical diet.

### Instructions

- Get single meal plan recommendation
    - Set target  as nutrition
      
      BUFA FOOD would generate a recommended food which fit the nutrition value input by the user.
      
        <img src="https://user-images.githubusercontent.com/108877977/207764174-ea0a8596-9e2f-422c-bfbf-7278845caefd.gif" width="900px" />
        
    
    - Set target as calories
        
      BUFA FOOD would generate a recommended meal which fit the calories value input by the user.
        
        <img src="https://user-images.githubusercontent.com/108877977/207764114-ec1edc3f-9c5d-4ff6-bde7-8e0d2d594f83.gif" width="900px" />
        
- Get one day recommendation

   BUFA FOOD would generate meal plans for breakfast, lunch and dinner which fit the calories and nutrition goals set by the user.
    
   <img src="https://user-images.githubusercontent.com/108877977/207764150-9110e1f8-8ca1-4e05-8dff-b2e00820b231.gif" width="900px" />
    
- Change date by click the date
    
    Click the place outside menu to change date once the date has been chosen.
    
    <img src="https://user-images.githubusercontent.com/108877977/207764150-9110e1f8-8ca1-4e05-8dff-b2e00820b231.gif" width="900px" />
        
### Architecture

- #### Server

    <img width="900px" src="https://user-images.githubusercontent.com/108877977/207765416-886b77c8-fa70-438b-bd58-be347cac8b06.png" />
    
- #### Table schema

    <img width="900px" src="https://user-images.githubusercontent.com/108877977/207765437-380284a4-9cd4-49e7-b7e0-2a8a97fedcb3.png" />


### Technologies
---

- Back-End
    
    `JavaScript` `Node.js` `Express` `MVC`
- Front-End
    
    `jQuery` `HTML` `CSS` `Bootstrap`
    
- Database
    
    `MySQL` `Redis`
    
- Linux
    
    `Crontab`
    
- AWS Services
    
    `EC2` `S3` `RDS` `ElastiCache` `CloudWatch` `CloudFront`
    
- Others
    
    `Web Crawling with Node.js` 
    
    `user-based collaborative filtering algorithm`
    
    > Calculate the Euclidean distance to find out the most related user with similar preferences for food recommendation.  
      <img width="300px" src="https://user-images.githubusercontent.com/108877977/207765886-43ab1f2b-8612-426e-9804-0c6013c50c43.jpeg" /> <img width="300px" src="https://user-images.githubusercontent.com/108877977/207765856-9a132a74-ceb6-4df4-bb15-f3cd5b1ef876.jpeg" /> 

