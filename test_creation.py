import requests



def main():
    # CREATE NEW USER
    # USER URL
    userurl = 'http://127.0.0.1:8000/api/user/'  # Adjust based on your actual route

    #CREATE USER
    data1 = {
        'username': 'new_user_567',
        'birthname': 'John Smith1',
        'email': 'new567@example.com',
    }
    data2 = {
        'username': 'new_user_789',
        'birthname': 'John Smith1',
        'email': 'new789@example.com',
    }

    post_data(data1, userurl)
    post_data(data2, userurl)

    #---------------------------------------------------------------------------------------------

    #CREATE NEW PLANT
    # PLANT URL 
    url = 'http://127.0.0.1:8000/api/plants/'

    data = {
        "name": "paprika",
        "description": "",
        "water_frequenty" : 30,
        # Include any other required fields for your Plant model
    }

    post_data(data, url)

    #Retrieve all plants

    response = requests.get(url)
    if response.status_code == 200:
        plants = response.json()
        for plant in plants:
            pass
            #print(plant)
    else:
        print("Failed to fetch plants:", response.status_code)

    #----------------------------------------------------------------------------------------

    #CREATE PLANT CARE
    url = 'http://127.0.0.1:8000/api/plant-care/'
    data1 = {
        "plant" : plants[5]["id"],
        "water_frequenty" : 30,
        "light_requirements": 30,
        "care_summary" : "Needs watering every 30 days"
    }

    data12 = {
        "plant" : plants[5]["id"],
        "water_frequenty" : 20,
        "light_requirements": "Full sun"
    }

    patch_data(data1, url)
    patch_data(data12, url)


    #-------------------------------------------------------------------------------------------
    
    #Add plants to our users
    url = 'http://127.0.0.1:8000/api/userplants/'
    data1 = {
        "user": 6,
        "plant" : plants[5]["id"]
    }

    data2 = {
        "user": 7,
        "plant" : plants[5]["id"]
    }

    data3 = {
        "user": 5,
        "plant" : plants[5]["id"]
    }

    data4 = {
        "user": 7,
        "plant" : plants[5]["id"]
    }

    data5 = {
        "user": 6,
        "plant" : plants[5]["id"]
    }
    
    data6 = {
        "user": 5,
        "plant" : plants[5]["id"]
    }

    data7 = {
        "user": 6,
        "plant" : plants[5]["id"]
    }

    # post_data(data1, url)
    # post_data(data2, url)
    # post_data(data3, url)
    # post_data(data4, url)
    # post_data(data5, url)
    # post_data(data6, url)
    # post_data(data7, url)


    #Get back, the userplants

    params = {'user_id':plants[5]["id"]}
    response = requests.get(url, params=params)
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        print("Response Data:")
        print(response.json())
    else:
        print("Error:", response.text)


def patch_data(data, url):

    response = requests.put(url, json=data)

    if response.status_code == 201:
        print('Posted, check the database!')
    else:
        print('Failed to create:', response.status_code, response.json())

def post_data(data, url):

    response = requests.post(url, json=data)

    if response.status_code == 201:
        print('Posted, check the database!')
    else:
        print('Failed to create:', response.status_code, response.json())




if __name__ == "__main__":
    main()