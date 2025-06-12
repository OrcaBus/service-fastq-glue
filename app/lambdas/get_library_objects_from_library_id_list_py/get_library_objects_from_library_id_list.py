#!/usr/bin/env python3

"""
Get library objects from library id list

Inputs:
    libraryIdList

Outputs:
    libraryObjectsList
"""

from orcabus_api_tools.metadata import get_libraries_list_from_library_id_list


def handler(event, context):
    """
    Get the library objects from the library id list.
    :param event:
    :param context:
    :return:
    """
    return {
        "libraryObjectsList": get_libraries_list_from_library_id_list(
            library_id_list=event.get("libraryIdList")
        )
    }


# if __name__ == "__main__":
#     from os import environ
#
#     environ['AWS_PROFILE'] = 'umccr-development'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#     print(handler(
#         {
#             "libraryIdList": [
#                 "L2401541",
#                 "L2401542",
#                 "L2401543",
#                 "L2401544",
#                 "L2401546",
#                 "L2401547",
#                 "L2401499",
#                 "L2401533",
#                 "L2401534"
#             ]
#         },
#         None
#     ))
