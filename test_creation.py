import requests



def main():
    # CREATE NEW USER
    # USER URL
    userurl = 'http://127.0.0.1:8000/api/user/'  # Adjust based on your actual route

    #CREATE USER
    # data1 = {
    #     'username': 'new_user_5676',
    #     'birthname': 'John Smith111',
    #     'email': 'new5637@example.com',
    # }
    # data2 = {
    #     'username': 'new_user_7897',
    #     'birthname': 'John Smith11',
    #     'email': 'new7389@example.com',
    # }

    # post_data(data1, userurl)
    # post_data(data2, userurl)

    #---------------------------------------------------------------------------------------------

    #CREATE NEW PLANT
    # PLANT URL 
    url = 'http://127.0.0.1:8000/api/plants/'

    data = {
        "name": "paprika",
        "description": "",
        "water_frequenty" : 30,
        "Scientific_name": "Capsicum annuum",
        # Include any other required fields for your Plant model
    }

    post_data(data, url)

    #Retrieve all plants

    response = requests.get(url)
    if response.status_code == 200:
        plants = response.json()
        for plant in plants:
            print(plant)
            pass
            print(plant)
    else:
        print("Failed to fetch plants:", response.status_code)
    
    exit()

    # #----------------------------------------------------------------------------------------

    # #CREATE PLANT CARE
    # url = 'http://127.0.0.1:8000/api/plant-care/'
    # data1 = {
    #     "plant" : plants[5]["id"],
    #     "water_frequenty" : 30,
    #     "light_requirements": 30,
    #     "care_summary" : "Needs watering every 30 days"
    # }

    # data12 = {
    #     "plant" : plants[5]["id"],
    #     "water_frequenty" : 20,
    #     "light_requirements": "Full sun"
    # }

    # # patch_data(data1, url)
    # # patch_data(data12, url)


    # #-------------------------------------------------------------------------------------------
    
    # #Add plants to our users
    url = 'http://127.0.0.1:8000/api/userplants/'
    data1 = {
        "user_id": 7,
    }

    data2 = {
        "user": 7,
        "plant" : 1
    }

    #post_data(data1, url)
    get_data(url, data1)

    

    # get_data(url, data1)
    # url2 = f'http://127.0.0.1:8000/api/userplants/2/'
    # response = requests.delete(url2)
    # if response.status_code == 204:
    #     print('Deleted successfully!')
    # else:
    #     print('Failed to delete:', response.status_code, response.text)
    # get_data(url, data1)
    # #Delete one userplant


def post_data(data, url):

    response = requests.post(url, json=data)

    if response.status_code == 201:
        print('Posted, check the database!')
    else:
        print('Failed to create:', response.status_code, response.json())


def get_data(url, params=None):
    response = requests.get(url, params=params)
    if response.status_code == 200:
        print('Data retrieved successfully!')
        print(response.json())
    else:
        print('Failed to retrieve:', response.status_code, response.text)


if __name__ == "__main__":
    main()