# <img width="35px" src="https://user-images.githubusercontent.com/108877977/208165619-9ac79e89-8c6e-4916-bb92-22b5960efdad.png"> BUFA FOOD 

### Description

Aim to solve the problem which people usually don’t know what to eat, how to eat healthy and  have a balanced diet in daily basis. Now people can easily get nutritious meal plans recommended by BUFA FOOD once setting up the body goal and information.

### Website 

- Recommend screen width: 1470px

- URL: https://bufafood.click/

- Test account **(Please login the test account to access the user-only function, such as meal diary and food recommendation.
)**

    > Account: bufafood@test.com  
    Password: test1234


### Features

- [x] Record daily meals.
- [x] Recommend customized healthy meal plans.
- [x] Weekly statistical summary of diet records.

### Instructions

- Get single meal plan recommendation
    - Set nutrition as target

      
      BUFA FOOD would generate a recommended food which fit the nutrition value input by the user.
      
        <img src="https://user-images.githubusercontent.com/108877977/207764174-ea0a8596-9e2f-422c-bfbf-7278845caefd.gif" width="900px" />
        
    
    - Set calories as target
        
      BUFA FOOD would generate a recommended meal which fit the calories value input by the user.
        
        <img src="https://user-images.githubusercontent.com/108877977/207764114-ec1edc3f-9c5d-4ff6-bde7-8e0d2d594f83.gif" width="900px" />
        
- Get one day recommendation

   BUFA FOOD would generate meal plans for breakfast, lunch and dinner which fit the calories and nutrition goals set by the user.
    
   <img src="https://user-images.githubusercontent.com/108877977/207764150-9110e1f8-8ca1-4e05-8dff-b2e00820b231.gif" width="900px" />
    
- Change date by click the date
    
    Click the place outside menu to change date once the date has been chosen.
    
    <img src="https://user-images.githubusercontent.com/108877977/208287440-5ad03b6e-6ab4-42d9-8c40-4a2fc4c10927.gif" width="900px" />
        
### Architecture

- #### Server

    <img width="900px" src="https://user-images.githubusercontent.com/108877977/207765416-886b77c8-fa70-438b-bd58-be347cac8b06.png" />
    
- #### Table schema

    <img width="900px" src="https://user-images.githubusercontent.com/108877977/209272323-2e4fd837-d2f4-43d0-9553-1b761af4ce66.png" />


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
    
    `Jest/ run unit test & integration test`
    
    `Web Crawling with Node.js` 
    
    `user-based collaborative filtering algorithm`
    
    > Calculate the Euclidean distance to find out the most related user with similar preferences for food recommendation.  
      <img width="300px" height="200px" src="https://user-images.githubusercontent.com/108877977/207765886-43ab1f2b-8612-426e-9804-0c6013c50c43.jpeg" /> <img width="300px" height="200px" src="https://user-images.githubusercontent.com/108877977/207765856-9a132a74-ceb6-4df4-bb15-f3cd5b1ef876.jpeg" /> 

